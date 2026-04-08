/**
 * No-Code Builder Engine
 * Core logic for drag-and-drop page building
 * Handles component tree, state management, and rendering
 */

const { v4: uuidv4 } = require('uuid');

class BuilderEngine {
  constructor() {
    this.components = new Map(); // Registered component definitions
    this.pageState = new Map();  // Active page states (by pageId)
    this.history = new Map();    // Undo/redo history
  }

  /**
   * Register a new component type
   * @param {string} type - Component type (e.g., 'text', 'image', 'container')
   * @param {Object} definition - Component definition with props, styles, events
   */
  registerComponent(type, definition) {
    this.components.set(type, {
      id: type,
      name: definition.name || type,
      category: definition.category || 'basic',
      icon: definition.icon || 'box',
      description: definition.description || '',
      defaultProps: definition.defaultProps || {},
      defaultStyles: definition.defaultStyles || {},
      editableProps: definition.editableProps || [],
      allowedChildren: definition.allowedChildren || [], // Empty = all allowed
      isContainer: definition.isContainer || false,
      renderTemplate: definition.renderTemplate || null,
      validationRules: definition.validationRules || {}
    });
  }

  /**
   * Initialize a new page state
   * @param {string} pageId - Unique page identifier
   * @param {Object} initialData - Initial page data
   * @returns {Object} Page state
   */
  initPage(pageId, initialData = {}) {
    const initialState = {
      id: pageId,
      root: {
        id: uuidv4(),
        type: 'container',
        props: { className: 'page-root' },
        styles: { 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          width: '100%'
        },
        children: []
      },
      selectedComponentId: null,
      viewport: 'desktop', // desktop, tablet, mobile
      mode: 'edit', // edit, preview, publish
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1920
      },
      globalStyles: initialData.globalStyles || {},
      metadata: initialData.metadata || {
        title: '',
        description: '',
        keywords: '',
        ogImage: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.pageState.set(pageId, initialState);
    this.history.set(pageId, []);
    
    return initialState;
  }

  /**
   * Get current page state
   * @param {string} pageId 
   * @returns {Object|null}
   */
  getPageState(pageId) {
    return this.pageState.get(pageId) || null;
  }

  /**
   * Add a component to the tree
   * @param {string} pageId 
   * @param {string} parentId - Parent component ID
   * @param {string} componentType - Type of component to add
   * @param {number} index - Position index (optional)
   * @returns {Object} Created component node
   */
  addComponent(pageId, parentId, componentType, index = -1) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    const componentDef = this.components.get(componentType);
    if (!componentDef) throw new Error(`Component type ${componentType} not registered`);

    // Validate parent-child relationship
    if (parentId !== 'root') {
      const parent = this.findComponent(state.root, parentId);
      if (parent) {
        const parentDef = this.components.get(parent.type);
        if (parentDef && parentDef.allowedChildren.length > 0) {
          if (!parentDef.allowedChildren.includes(componentType)) {
            throw new Error(`Component ${componentType} cannot be child of ${parent.type}`);
          }
        }
      }
    }

    const newComponent = {
      id: uuidv4(),
      type: componentType,
      props: { ...componentDef.defaultProps },
      styles: { ...componentDef.defaultStyles },
      children: componentDef.isContainer ? [] : undefined,
      dataBindings: {}, // For dynamic data binding
      conditions: null, // For conditional rendering
      animations: null  // For animations/micro-interactions
    };

    this.saveHistory(pageId);

    if (parentId === 'root') {
      if (index === -1 || index >= state.root.children.length) {
        state.root.children.push(newComponent);
      } else {
        state.root.children.splice(index, 0, newComponent);
      }
    } else {
      const parent = this.findComponent(state.root, parentId);
      if (!parent || !parent.children) {
        throw new Error('Parent component not found or is not a container');
      }
      if (index === -1 || index >= parent.children.length) {
        parent.children.push(newComponent);
      } else {
        parent.children.splice(index, 0, newComponent);
      }
    }

    state.updatedAt = new Date().toISOString();
    state.selectedComponentId = newComponent.id;

    return newComponent;
  }

  /**
   * Remove a component from the tree
   * @param {string} pageId 
   * @param {string} componentId 
   * @returns {boolean} Success status
   */
  removeComponent(pageId, componentId) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    if (componentId === state.root.id) {
      throw new Error('Cannot remove root component');
    }

    this.saveHistory(pageId);

    const removed = this.removeComponentRecursive(state.root, componentId);
    if (removed) {
      state.updatedAt = new Date().toISOString();
      if (state.selectedComponentId === componentId) {
        state.selectedComponentId = null;
      }
    }

    return removed;
  }

  /**
   * Update component properties
   * @param {string} pageId 
   * @param {string} componentId 
   * @param {Object} updates - Properties to update
   */
  updateComponent(pageId, componentId, updates) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    const component = this.findComponent(state.root, componentId);
    if (!component) throw new Error(`Component ${componentId} not found`);

    this.saveHistory(pageId);

    if (updates.props) {
      component.props = { ...component.props, ...updates.props };
    }
    if (updates.styles) {
      component.styles = { ...component.styles, ...updates.styles };
    }
    if (updates.dataBindings) {
      component.dataBindings = { ...component.dataBindings, ...updates.dataBindings };
    }
    if (updates.conditions !== undefined) {
      component.conditions = updates.conditions;
    }
    if (updates.animations !== undefined) {
      component.animations = updates.animations;
    }

    state.updatedAt = new Date().toISOString();
    return component;
  }

  /**
   * Move component (drag & drop reordering)
   * @param {string} pageId 
   * @param {string} componentId 
   * @param {string} newParentId 
   * @param {number} newIndex 
   * @returns {Object} Updated component
   */
  moveComponent(pageId, componentId, newParentId, newIndex) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    if (componentId === state.root.id) {
      throw new Error('Cannot move root component');
    }

    // Check for circular dependency
    if (newParentId !== 'root') {
      const newParent = this.findComponent(state.root, newParentId);
      if (newParent && this.isDescendant(newParent, componentId)) {
        throw new Error('Cannot move component into its own descendant');
      }
    }

    this.saveHistory(pageId);

    // Remove from old parent
    let component = null;
    if (state.root.children.some(c => c.id === componentId)) {
      const idx = state.root.children.findIndex(c => c.id === componentId);
      [component] = state.root.children.splice(idx, 1);
    } else {
      component = this.removeFromParentRecursive(state.root, componentId);
    }

    if (!component) throw new Error('Component not found');

    // Add to new parent
    if (newParentId === 'root') {
      if (newIndex === -1 || newIndex >= state.root.children.length) {
        state.root.children.push(component);
      } else {
        state.root.children.splice(newIndex, 0, component);
      }
    } else {
      const newParent = this.findComponent(state.root, newParentId);
      if (!newParent || !newParent.children) {
        throw new Error('New parent not found or is not a container');
      }
      if (newIndex === -1 || newIndex >= newParent.children.length) {
        newParent.children.push(component);
      } else {
        newParent.children.splice(newIndex, 0, component);
      }
    }

    state.updatedAt = new Date().toISOString();
    return component;
  }

  /**
   * Duplicate a component
   * @param {string} pageId 
   * @param {string} componentId 
   * @returns {Object} Duplicated component
   */
  duplicateComponent(pageId, componentId) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    const component = this.findComponent(state.root, componentId);
    if (!component) throw new Error(`Component ${componentId} not found`);

    this.saveHistory(pageId);

    const duplicated = this.deepCloneComponent(component);
    
    // Find parent and insert after original
    let inserted = false;
    if (state.root.children.some(c => c.id === componentId)) {
      const idx = state.root.children.findIndex(c => c.id === componentId);
      state.root.children.splice(idx + 1, 0, duplicated);
      inserted = true;
    } else {
      inserted = this.insertAfterComponentRecursive(state.root, componentId, duplicated);
    }

    if (!inserted) throw new Error('Failed to insert duplicated component');

    state.updatedAt = new Date().toISOString();
    state.selectedComponentId = duplicated.id;
    
    return duplicated;
  }

  /**
   * Undo last action
   * @param {string} pageId 
   * @returns {boolean} Success status
   */
  undo(pageId) {
    const history = this.history.get(pageId);
    const state = this.pageState.get(pageId);
    
    if (!history || history.length === 0 || !state) return false;

    const previousState = history.pop();
    this.pageState.set(pageId, JSON.parse(previousState));
    
    return true;
  }

  /**
   * Redo action
   * @param {string} pageId 
   * @returns {boolean} Success status
   */
  redo(pageId) {
    // Implementation would require separate redo stack
    // Simplified version for now
    return false;
  }

  /**
   * Export page as JSON
   * @param {string} pageId 
   * @returns {Object} Page JSON
   */
  exportPage(pageId) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    return {
      id: state.id,
      root: state.root,
      globalStyles: state.globalStyles,
      metadata: state.metadata,
      breakpoints: state.breakpoints,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import page from JSON
   * @param {string} pageId 
   * @param {Object} pageData 
   * @returns {Object} Imported state
   */
  importPage(pageId, pageData) {
    const importedState = {
      id: pageId,
      root: pageData.root,
      selectedComponentId: null,
      viewport: 'desktop',
      mode: 'edit',
      breakpoints: pageData.breakpoints || {
        mobile: 768,
        tablet: 1024,
        desktop: 1920
      },
      globalStyles: pageData.globalStyles || {},
      metadata: pageData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.pageState.set(pageId, importedState);
    this.history.set(pageId, []);
    
    return importedState;
  }

  /**
   * Generate HTML/CSS from page state
   * @param {string} pageId 
   * @param {Object} options - Rendering options
   * @returns {Object} { html, css, js }
   */
  renderPage(pageId, options = {}) {
    const state = this.pageState.get(pageId);
    if (!state) throw new Error(`Page ${pageId} not found`);

    const { ssr = false, minify = false, includeComments = true } = options;

    let html = '';
    let css = '';
    const js = [];

    // Generate CSS from global styles and component styles
    css += this.generateGlobalCSS(state.globalStyles);
    css += this.generateResponsiveCSS(state.breakpoints);

    // Recursively render components
    const renderResult = this.renderComponentRecursive(state.root, state, { ssr, includeComments });
    html = renderResult.html;
    css += renderResult.css;
    js.push(...renderResult.js);

    if (minify) {
      html = this.minifyHTML(html);
      css = this.minifyCSS(css);
    }

    return { html, css, js: js.join('\n') };
  }

  /**
   * Validate component tree
   * @param {string} pageId 
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validatePage(pageId) {
    const state = this.pageState.get(pageId);
    if (!state) return { valid: false, errors: ['Page not found'] };

    const errors = [];
    this.validateComponentRecursive(state.root, state, errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== PRIVATE HELPERS ====================

  saveHistory(pageId) {
    const state = this.pageState.get(pageId);
    const history = this.history.get(pageId) || [];
    
    // Limit history to 50 states
    if (history.length >= 50) {
      history.shift();
    }
    
    history.push(JSON.stringify(state));
    this.history.set(pageId, history);
  }

  findComponent(root, componentId) {
    if (root.id === componentId) return root;
    
    if (root.children) {
      for (const child of root.children) {
        const found = this.findComponent(child, componentId);
        if (found) return found;
      }
    }
    
    return null;
  }

  removeComponentRecursive(node, componentId) {
    if (!node.children) return false;
    
    const index = node.children.findIndex(c => c.id === componentId);
    if (index !== -1) {
      node.children.splice(index, 1);
      return true;
    }
    
    for (const child of node.children) {
      if (this.removeComponentRecursive(child, componentId)) {
        return true;
      }
    }
    
    return false;
  }

  removeFromParentRecursive(node, componentId) {
    if (!node.children) return null;
    
    const index = node.children.findIndex(c => c.id === componentId);
    if (index !== -1) {
      const [removed] = node.children.splice(index, 1);
      return removed;
    }
    
    for (const child of node.children) {
      const removed = this.removeFromParentRecursive(child, componentId);
      if (removed) return removed;
    }
    
    return null;
  }

  isDescendant(parent, childId) {
    if (!parent.children) return false;
    
    for (const child of parent.children) {
      if (child.id === childId) return true;
      if (this.isDescendant(child, childId)) return true;
    }
    
    return false;
  }

  insertAfterComponentRecursive(node, targetId, componentToInsert) {
    if (!node.children) return false;
    
    const index = node.children.findIndex(c => c.id === targetId);
    if (index !== -1) {
      node.children.splice(index + 1, 0, componentToInsert);
      return true;
    }
    
    for (const child of node.children) {
      if (this.insertAfterComponentRecursive(child, targetId, componentToInsert)) {
        return true;
      }
    }
    
    return false;
  }

  deepCloneComponent(component) {
    const clone = {
      id: uuidv4(),
      type: component.type,
      props: JSON.parse(JSON.stringify(component.props)),
      styles: JSON.parse(JSON.stringify(component.styles)),
      dataBindings: JSON.parse(JSON.stringify(component.dataBindings || {})),
      conditions: component.conditions ? JSON.parse(JSON.stringify(component.conditions)) : null,
      animations: component.animations ? JSON.parse(JSON.stringify(component.animations)) : null
    };

    if (component.children) {
      clone.children = component.children.map(child => this.deepCloneComponent(child));
    }

    return clone;
  }

  renderComponentRecursive(component, state, options) {
    const componentDef = this.components.get(component.type);
    if (!componentDef) {
      return { html: '<!-- Unknown component -->', css: '', js: [] };
    }

    let html = '';
    let css = '';
    const js = [];

    // Apply conditional rendering
    if (component.conditions && !this.evaluateCondition(component.conditions, state)) {
      return { html: '', css: '', js: [] };
    }

    // Generate unique class name
    const className = `cmp-${component.id.replace(/-/g, '')}`;
    
    // Build style string
    const styleString = this.buildStyleString(component.styles, state.viewport);
    
    // Open tag
    const tagName = componentDef.renderTemplate?.tag || 'div';
    html += `<${tagName} class="${className}"${styleString ? ` style="${styleString}"` : ''}`;
    
    // Add data attributes for editor
    if (options.includeComments) {
      html += ` data-component-id="${component.id}" data-component-type="${component.type}"`;
    }
    
    html += '>';

    // Add content based on component type
    if (componentDef.renderTemplate?.content) {
      html += this.interpolateContent(componentDef.renderTemplate.content, component.props);
    } else if (component.type === 'text') {
      html += component.props.content || '';
    } else if (component.type === 'image') {
      html += `<img src="${component.props.src || ''}" alt="${component.props.alt || ''}" />`;
    }

    // Render children if container
    if (component.children && component.children.length > 0) {
      for (const child of component.children) {
        const childResult = this.renderComponentRecursive(child, state, options);
        html += childResult.html;
        css += childResult.css;
        js.push(...childResult.js);
      }
    }

    // Close tag
    html += `</${tagName}>`;

    // Generate component-specific CSS
    css += this.generateComponentCSS(className, component.styles, component.type);

    // Add JavaScript if needed (for interactive components)
    if (componentDef.renderTemplate?.js) {
      js.push(componentDef.renderTemplate.js.replace(/{{id}}/g, component.id));
    }

    return { html, css, js };
  }

  buildStyleString(styles, viewport) {
    if (!styles || Object.keys(styles).length === 0) return '';
    
    return Object.entries(styles)
      .filter(([key]) => !key.startsWith('@')) // Skip responsive prefixes for inline
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  generateGlobalCSS(globalStyles) {
    if (!globalStyles || Object.keys(globalStyles).length === 0) return '';
    
    let css = ':root {\n';
    for (const [key, value] of Object.entries(globalStyles)) {
      css += `  --${key}: ${value};\n`;
    }
    css += '}\n';
    
    return css;
  }

  generateResponsiveCSS(breakpoints) {
    let css = '';
    
    css += `@media (max-width: ${breakpoints.tablet}px) {\n`;
    css += `  .viewport-tablet { display: block; }\n`;
    css += `  .viewport-desktop { display: none; }\n`;
    css += `}\n`;
    
    css += `@media (max-width: ${breakpoints.mobile}px) {\n`;
    css += `  .viewport-mobile { display: block; }\n`;
    css += `  .viewport-tablet, .viewport-desktop { display: none; }\n`;
    css += `}\n`;
    
    return css;
  }

  generateComponentCSS(className, styles, type) {
    if (!styles || Object.keys(styles).length === 0) return '';
    
    let css = `.${className} {\n`;
    
    for (const [key, value] of Object.entries(styles)) {
      if (key.startsWith('@')) continue; // Handle responsive separately
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  ${cssKey}: ${value};\n`;
    }
    
    css += '}\n';
    
    // Add responsive styles
    if (styles['@tablet'] || styles['@mobile']) {
      if (styles['@tablet']) {
        css += `@media (max-width: 1024px) {\n`;
        css += `  .${className} {\n`;
        for (const [key, value] of Object.entries(styles['@tablet'])) {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          css += `    ${cssKey}: ${value};\n`;
        }
        css += `  }\n`;
        css += `}\n`;
      }
      
      if (styles['@mobile']) {
        css += `@media (max-width: 768px) {\n`;
        css += `  .${className} {\n`;
        for (const [key, value] of Object.entries(styles['@mobile'])) {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          css += `    ${cssKey}: ${value};\n`;
        }
        css += `  }\n`;
        css += `}\n`;
      }
    }
    
    return css;
  }

  interpolateContent(template, props) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return props[key] !== undefined ? props[key] : match;
    });
  }

  evaluateCondition(condition, state) {
    // Simplified condition evaluation
    // In production, this would support complex expressions
    if (!condition) return true;
    
    const { field, operator, value } = condition;
    const contextValue = this.getContextValue(field, state);
    
    switch (operator) {
      case 'equals': return contextValue === value;
      case 'notEquals': return contextValue !== value;
      case 'contains': return String(contextValue).includes(value);
      case 'greaterThan': return Number(contextValue) > Number(value);
      case 'lessThan': return Number(contextValue) < Number(value);
      default: return true;
    }
  }

  getContextValue(field, state) {
    // Support for CMS data bindings, user context, etc.
    if (field.startsWith('cms.')) {
      // Would fetch from CMS collection in real implementation
      return null;
    }
    if (field.startsWith('user.')) {
      // Would fetch from user context
      return null;
    }
    return null;
  }

  validateComponentRecursive(component, state, errors) {
    const componentDef = this.components.get(component.type);
    if (!componentDef) {
      errors.push(`Unknown component type: ${component.type}`);
      return;
    }

    // Validate required props
    if (componentDef.editableProps) {
      for (const prop of componentDef.editableProps) {
        if (prop.required && (component.props[prop.name] === undefined || component.props[prop.name] === '')) {
          errors.push(`Component ${component.type}: Missing required property "${prop.name}"`);
        }
      }
    }

    // Validate children
    if (component.children) {
      for (const child of component.children) {
        this.validateComponentRecursive(child, state, errors);
      }
    }
  }

  minifyHTML(html) {
    return html
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();
  }

  minifyCSS(css) {
    return css
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/\/\*.*?\*\//g, '')
      .trim();
  }
}

// Register default components
function registerDefaultComponents(engine) {
  // Container
  engine.registerComponent('container', {
    name: 'Container',
    category: 'layout',
    icon: 'box',
    description: 'Flexible container for layout',
    isContainer: true,
    defaultProps: {
      className: '',
      tagName: 'div'
    },
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '16px'
    },
    editableProps: [
      { name: 'className', type: 'text', label: 'CSS Class' },
      { name: 'tagName', type: 'select', label: 'HTML Tag', options: ['div', 'section', 'article', 'aside', 'main', 'header', 'footer'] }
    ]
  });

  // Text
  engine.registerComponent('text', {
    name: 'Text',
    category: 'basic',
    icon: 'type',
    description: 'Simple text block',
    defaultProps: {
      content: 'Edit this text',
      tagName: 'p'
    },
    defaultStyles: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#333'
    },
    editableProps: [
      { name: 'content', type: 'richtext', label: 'Content', required: true },
      { name: 'tagName', type: 'select', label: 'HTML Tag', options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'] }
    ],
    renderTemplate: {
      tag: 'p',
      content: '{{content}}'
    }
  });

  // Image
  engine.registerComponent('image', {
    name: 'Image',
    category: 'media',
    icon: 'image',
    description: 'Image with alt text',
    defaultProps: {
      src: '',
      alt: 'Image description',
      width: '100%',
      height: 'auto'
    },
    defaultStyles: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '0'
    },
    editableProps: [
      { name: 'src', type: 'image', label: 'Image URL', required: true },
      { name: 'alt', type: 'text', label: 'Alt Text' },
      { name: 'width', type: 'text', label: 'Width' },
      { name: 'height', type: 'text', label: 'Height' }
    ]
  });

  // Button
  engine.registerComponent('button', {
    name: 'Button',
    category: 'interactive',
    icon: 'mouse-pointer',
    description: 'Clickable button',
    defaultProps: {
      text: 'Click Me',
      href: '#',
      target: '_self',
      variant: 'primary'
    },
    defaultStyles: {
      padding: '12px 24px',
      backgroundColor: '#007bff',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600'
    },
    editableProps: [
      { name: 'text', type: 'text', label: 'Button Text', required: true },
      { name: 'href', type: 'text', label: 'Link URL' },
      { name: 'target', type: 'select', label: 'Target', options: ['_self', '_blank', '_parent', '_top'] },
      { name: 'variant', type: 'select', label: 'Variant', options: ['primary', 'secondary', 'outline', 'ghost'] }
    ],
    events: ['click'],
    renderTemplate: {
      tag: 'a',
      content: '{{text}}'
    }
  });

  // Hero Section
  engine.registerComponent('hero', {
    name: 'Hero Section',
    category: 'sections',
    icon: 'layout-template',
    description: 'Large hero section with headline and CTA',
    isContainer: true,
    defaultProps: {
      title: 'Welcome to Our Site',
      subtitle: 'Create amazing websites without code',
      backgroundImage: '',
      overlayColor: 'rgba(0,0,0,0.5)'
    },
    defaultStyles: {
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '80px 20px',
      position: 'relative',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    editableProps: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'subtitle', type: 'text', label: 'Subtitle' },
      { name: 'backgroundImage', type: 'image', label: 'Background Image' },
      { name: 'overlayColor', type: 'color', label: 'Overlay Color' }
    ]
  });

  // Grid
  engine.registerComponent('grid', {
    name: 'Grid',
    category: 'layout',
    icon: 'grid-3x3',
    description: 'Responsive grid layout',
    isContainer: true,
    defaultProps: {
      columns: 3,
      gap: '20px'
    },
    defaultStyles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px'
    },
    editableProps: [
      { name: 'columns', type: 'number', label: 'Columns', min: 1, max: 12 },
      { name: 'gap', type: 'text', label: 'Gap' }
    ]
  });

  // Spacer
  engine.registerComponent('spacer', {
    name: 'Spacer',
    category: 'layout',
    icon: 'arrows-alt-v',
    description: 'Vertical spacing',
    defaultProps: {
      height: '40px'
    },
    defaultStyles: {
      height: '40px',
      width: '100%'
    },
    editableProps: [
      { name: 'height', type: 'text', label: 'Height', required: true }
    ]
  });

  // Video
  engine.registerComponent('video', {
    name: 'Video',
    category: 'media',
    icon: 'video',
    description: 'Embedded video player',
    defaultProps: {
      src: '',
      autoplay: false,
      controls: true,
      loop: false
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '16/9'
    },
    editableProps: [
      { name: 'src', type: 'text', label: 'Video URL', required: true },
      { name: 'autoplay', type: 'boolean', label: 'Autoplay' },
      { name: 'controls', type: 'boolean', label: 'Show Controls' },
      { name: 'loop', type: 'boolean', label: 'Loop' }
    ]
  });

  // Form
  engine.registerComponent('form', {
    name: 'Form',
    category: 'interactive',
    icon: 'envelope',
    description: 'Contact form',
    isContainer: true,
    defaultProps: {
      action: '/api/submit',
      method: 'POST',
      submitButtonText: 'Send Message'
    },
    defaultStyles: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxWidth: '600px'
    },
    editableProps: [
      { name: 'action', type: 'text', label: 'Form Action URL' },
      { name: 'method', type: 'select', label: 'Method', options: ['GET', 'POST'] },
      { name: 'submitButtonText', type: 'text', label: 'Submit Button Text' }
    ],
    events: ['submit']
  });

  // Navigation
  engine.registerComponent('navigation', {
    name: 'Navigation',
    category: 'sections',
    icon: 'bars',
    description: 'Site navigation menu',
    isContainer: true,
    defaultProps: {
      logo: '',
      logoAlt: 'Logo',
      items: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' }
      ]
    },
    defaultStyles: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    editableProps: [
      { name: 'logo', type: 'image', label: 'Logo URL' },
      { name: 'logoAlt', type: 'text', label: 'Logo Alt Text' }
    ]
  });
}

module.exports = { BuilderEngine, registerDefaultComponents };
