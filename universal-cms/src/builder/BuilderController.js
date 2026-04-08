/**
 * Builder API Controller
 * REST API endpoints for No-Code Builder operations
 */

const express = require('express');
const { BuilderEngine, registerDefaultComponents } = require('./BuilderEngine');

class BuilderController {
  constructor() {
    this.engine = new BuilderEngine();
    this.router = express.Router();
    
    // Register default components
    registerDefaultComponents(this.engine);
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Page management
    this.router.post('/pages/:pageId/init', this.initPage.bind(this));
    this.router.get('/pages/:pageId', this.getPage.bind(this));
    this.router.put('/pages/:pageId', this.updatePage.bind(this));
    this.router.delete('/pages/:pageId', this.deletePage.bind(this));
    
    // Component operations
    this.router.post('/pages/:pageId/components', this.addComponent.bind(this));
    this.router.put('/pages/:pageId/components/:componentId', this.updateComponent.bind(this));
    this.router.delete('/pages/:pageId/components/:componentId', this.removeComponent.bind(this));
    this.router.post('/pages/:pageId/components/:componentId/move', this.moveComponent.bind(this));
    this.router.post('/pages/:pageId/components/:componentId/duplicate', this.duplicateComponent.bind(this));
    
    // History operations
    this.router.post('/pages/:pageId/undo', this.undo.bind(this));
    this.router.post('/pages/:pageId/redo', this.redo.bind(this));
    
    // Export/Import
    this.router.get('/pages/:pageId/export', this.exportPage.bind(this));
    this.router.post('/pages/:pageId/import', this.importPage.bind(this));
    
    // Rendering
    this.router.get('/pages/:pageId/render', this.renderPage.bind(this));
    this.router.get('/pages/:pageId/validate', this.validatePage.bind(this));
    
    // Component library
    this.router.get('/components', this.getComponentLibrary.bind(this));
    this.router.post('/components', this.registerComponent.bind(this));
  }

  /**
   * Initialize a new page
   * POST /api/builder/pages/:pageId/init
   */
  async initPage(req, res) {
    try {
      const { pageId } = req.params;
      const { globalStyles, metadata } = req.body || {};
      
      const state = this.engine.initPage(pageId, { globalStyles, metadata });
      
      res.json({
        success: true,
        data: state,
        message: 'Page initialized successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get page state
   * GET /api/builder/pages/:pageId
   */
  async getPage(req, res) {
    try {
      const { pageId } = req.params;
      
      const state = this.engine.getPageState(pageId);
      
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'Page not found'
        });
      }
      
      res.json({
        success: true,
        data: state
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update page metadata or global styles
   * PUT /api/builder/pages/:pageId
   */
  async updatePage(req, res) {
    try {
      const { pageId } = req.params;
      const { globalStyles, metadata, breakpoints } = req.body;
      
      const state = this.engine.getPageState(pageId);
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'Page not found'
        });
      }
      
      if (globalStyles) {
        state.globalStyles = { ...state.globalStyles, ...globalStyles };
      }
      if (metadata) {
        state.metadata = { ...state.metadata, ...metadata };
      }
      if (breakpoints) {
        state.breakpoints = { ...state.breakpoints, ...breakpoints };
      }
      
      state.updatedAt = new Date().toISOString();
      
      res.json({
        success: true,
        data: state,
        message: 'Page updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete page
   * DELETE /api/builder/pages/:pageId
   */
  async deletePage(req, res) {
    try {
      const { pageId } = req.params;
      
      const deleted = this.engine.pageState.delete(pageId);
      this.engine.history.delete(pageId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Page not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Page deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Add component to page
   * POST /api/builder/pages/:pageId/components
   */
  async addComponent(req, res) {
    try {
      const { pageId } = req.params;
      const { parentId, componentType, index } = req.body;
      
      if (!parentId || !componentType) {
        return res.status(400).json({
          success: false,
          error: 'parentId and componentType are required'
        });
      }
      
      const component = this.engine.addComponent(pageId, parentId, componentType, index);
      
      res.json({
        success: true,
        data: component,
        message: 'Component added successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update component
   * PUT /api/builder/pages/:pageId/components/:componentId
   */
  async updateComponent(req, res) {
    try {
      const { pageId, componentId } = req.params;
      const updates = req.body;
      
      const component = this.engine.updateComponent(pageId, componentId, updates);
      
      res.json({
        success: true,
        data: component,
        message: 'Component updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove component
   * DELETE /api/builder/pages/:pageId/components/:componentId
   */
  async removeComponent(req, res) {
    try {
      const { pageId, componentId } = req.params;
      
      const removed = this.engine.removeComponent(pageId, componentId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Component not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Component removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Move component (drag & drop)
   * POST /api/builder/pages/:pageId/components/:componentId/move
   */
  async moveComponent(req, res) {
    try {
      const { pageId, componentId } = req.params;
      const { newParentId, newIndex } = req.body;
      
      if (newParentId === undefined || newIndex === undefined) {
        return res.status(400).json({
          success: false,
          error: 'newParentId and newIndex are required'
        });
      }
      
      const component = this.engine.moveComponent(pageId, componentId, newParentId, newIndex);
      
      res.json({
        success: true,
        data: component,
        message: 'Component moved successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Duplicate component
   * POST /api/builder/pages/:pageId/components/:componentId/duplicate
   */
  async duplicateComponent(req, res) {
    try {
      const { pageId, componentId } = req.params;
      
      const duplicated = this.engine.duplicateComponent(pageId, componentId);
      
      res.json({
        success: true,
        data: duplicated,
        message: 'Component duplicated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Undo last action
   * POST /api/builder/pages/:pageId/undo
   */
  async undo(req, res) {
    try {
      const { pageId } = req.params;
      
      const success = this.engine.undo(pageId);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'No actions to undo'
        });
      }
      
      const state = this.engine.getPageState(pageId);
      
      res.json({
        success: true,
        data: state,
        message: 'Action undone successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Redo action
   * POST /api/builder/pages/:pageId/redo
   */
  async redo(req, res) {
    try {
      const { pageId } = req.params;
      
      const success = this.engine.redo(pageId);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'No actions to redo'
        });
      }
      
      const state = this.engine.getPageState(pageId);
      
      res.json({
        success: true,
        data: state,
        message: 'Action redone successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Export page as JSON
   * GET /api/builder/pages/:pageId/export
   */
  async exportPage(req, res) {
    try {
      const { pageId } = req.params;
      
      const pageData = this.engine.exportPage(pageId);
      
      res.json({
        success: true,
        data: pageData
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Import page from JSON
   * POST /api/builder/pages/:pageId/import
   */
  async importPage(req, res) {
    try {
      const { pageId } = req.params;
      const pageData = req.body;
      
      if (!pageData || !pageData.root) {
        return res.status(400).json({
          success: false,
          error: 'Invalid page data'
        });
      }
      
      const state = this.engine.importPage(pageId, pageData);
      
      res.json({
        success: true,
        data: state,
        message: 'Page imported successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Render page to HTML/CSS
   * GET /api/builder/pages/:pageId/render
   */
  async renderPage(req, res) {
    try {
      const { pageId } = req.params;
      const { ssr = false, minify = false, includeComments = true } = req.query;
      
      const result = this.engine.renderPage(pageId, {
        ssr: ssr === 'true',
        minify: minify === 'true',
        includeComments: includeComments !== 'false'
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validate page
   * GET /api/builder/pages/:pageId/validate
   */
  async validatePage(req, res) {
    try {
      const { pageId } = req.params;
      
      const validation = this.engine.validatePage(pageId);
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get component library
   * GET /api/builder/components
   */
  async getComponentLibrary(req, res) {
    try {
      const { category } = req.query;
      
      const components = Array.from(this.engine.components.values());
      
      const filtered = category 
        ? components.filter(c => c.category === category)
        : components;
      
      res.json({
        success: true,
        data: filtered
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Register custom component
   * POST /api/builder/components
   */
  async registerComponent(req, res) {
    try {
      const { type, definition } = req.body;
      
      if (!type || !definition) {
        return res.status(400).json({
          success: false,
          error: 'type and definition are required'
        });
      }
      
      this.engine.registerComponent(type, definition);
      
      res.json({
        success: true,
        message: 'Component registered successfully',
        data: this.engine.components.get(type)
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get router for mounting in main app
   */
  getRouter() {
    return this.router;
  }
}

module.exports = BuilderController;
