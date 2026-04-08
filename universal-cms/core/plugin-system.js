/**
 * Plugin System - Система плагінів
 * Дозволяє розширювати функціональність CMS через плагіни
 */

class PluginSystem {
  constructor(cms) {
    this.cms = cms;
    this.plugins = new Map();
    this.hooks = new Map();
    this.routes = [];
    this.adminPages = new Map();
    this.middleware = [];
  }

  /**
   * Ініціалізація системи плагінів
   */
  async init() {
    // Завантаження встановлених плагінів
    await this.loadPlugins();
  }

  /**
   * Реєстрація плагіна
   */
  register(pluginDefinition) {
    const plugin = {
      name: pluginDefinition.name,
      version: pluginDefinition.version,
      description: pluginDefinition.description || '',
      author: pluginDefinition.author || '',
      
      // Хуки
      hooks: pluginDefinition.hooks || {},
      
      // Маршрути API
      routes: pluginDefinition.routes || [],
      
      // Сторінки адмін-панелі
      adminPages: pluginDefinition.adminPages || {},
      
      // Middleware
      middleware: pluginDefinition.middleware || [],
      
      // Конфігурація
      config: pluginDefinition.config || {},
      
      // Методи життєвого циклу
      install: pluginDefinition.install || null,
      uninstall: pluginDefinition.uninstall || null,
      activate: pluginDefinition.activate || null,
      deactivate: pluginDefinition.deactivate || null,
      
      // Залежності
      dependencies: pluginDefinition.dependencies || [],
      
      // Стан
      enabled: false,
      installed: false
    };

    // Перевірка залежностей
    this.checkDependencies(plugin);

    this.plugins.set(plugin.name, plugin);

    return this;
  }

  /**
   * Перевірка залежностей плагіна
   */
  checkDependencies(plugin) {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return;
    }

    for (const dep of plugin.dependencies) {
      const [name, version] = dep.split('@');
      const depPlugin = this.plugins.get(name);

      if (!depPlugin) {
        throw new Error(`Plugin "${plugin.name}" requires "${name}" which is not installed`);
      }

      if (version && depPlugin.version !== version) {
        console.warn(`Plugin "${plugin.name}" requires "${name}@${version}", found "${depPlugin.version}"`);
      }
    }
  }

  /**
   * Встановлення плагіна
   */
  async install(pluginName) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    if (plugin.installed) {
      throw new Error(`Plugin "${pluginName}" is already installed`);
    }

    // Виконання логіки встановлення
    if (plugin.install) {
      await plugin.install(this.cms);
    }

    // Реєстрація хуків
    this.registerHooks(plugin);

    // Реєстрація маршрутів
    this.registerRoutes(plugin);

    // Реєстрація сторінок адмін-панелі
    this.registerAdminPages(plugin);

    // Додавання middleware
    this.registerMiddleware(plugin);

    plugin.installed = true;
    plugin.enabled = true;

    this.cms.emit('plugin:installed', { name: plugin.name, version: plugin.version });

    return plugin;
  }

  /**
   * Видалення плагіна
   */
  async uninstall(pluginName) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    // Видалення хуків
    this.unregisterHooks(plugin);

    // Видалення маршрутів
    this.unregisterRoutes(plugin);

    // Видалення сторінок адмін-панелі
    this.unregisterAdminPages(plugin);

    // Видалення middleware
    this.unregisterMiddleware(plugin);

    // Виконання логіки видалення
    if (plugin.uninstall) {
      await plugin.uninstall(this.cms);
    }

    plugin.installed = false;
    plugin.enabled = false;

    this.cms.emit('plugin:uninstalled', { name: plugin.name });

    return plugin;
  }

  /**
   * Активація плагіна
   */
  async activate(pluginName) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    if (!plugin.installed) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    if (plugin.enabled) {
      return plugin;
    }

    if (plugin.activate) {
      await plugin.activate(this.cms);
    }

    plugin.enabled = true;

    this.cms.emit('plugin:activated', { name: plugin.name });

    return plugin;
  }

  /**
   * Деактивація плагіна
   */
  async deactivate(pluginName) {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    if (!plugin.enabled) {
      return plugin;
    }

    if (plugin.deactivate) {
      await plugin.deactivate(this.cms);
    }

    plugin.enabled = false;

    this.cms.emit('plugin:deactivated', { name: plugin.name });

    return plugin;
  }

  /**
   * Реєстрація хуків плагіна
   */
  registerHooks(plugin) {
    for (const [eventName, callback] of Object.entries(plugin.hooks)) {
      if (!this.hooks.has(eventName)) {
        this.hooks.set(eventName, []);
      }

      const wrappedCallback = async (...args) => {
        if (plugin.enabled && typeof callback === 'function') {
          return callback(...args);
        }
      };

      this.hooks.get(eventName).push({
        plugin: plugin.name,
        callback: wrappedCallback,
        priority: callback.priority || 0
      });

      // Сортування за пріоритетом
      this.hooks.get(eventName).sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Видалення хуків плагіна
   */
  unregisterHooks(plugin) {
    for (const [eventName, hooks] of this.hooks.entries()) {
      const filtered = hooks.filter(h => h.plugin !== plugin.name);
      
      if (filtered.length === 0) {
        this.hooks.delete(eventName);
      } else {
        this.hooks.set(eventName, filtered);
      }
    }
  }

  /**
   * Виконання хуків
   */
  async executeHooks(eventName, payload) {
    const hooks = this.hooks.get(eventName);
    
    if (!hooks || hooks.length === 0) {
      return;
    }

    let result = payload;

    for (const hook of hooks) {
      if (hook.callback) {
        const hookResult = await hook.callback(result, this.cms);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      }
    }

    return result;
  }

  /**
   * Реєстрація маршрутів API
   */
  registerRoutes(plugin) {
    for (const route of plugin.routes) {
      this.routes.push({
        plugin: plugin.name,
        ...route
      });
    }
  }

  /**
   * Видалення маршрутів плагіна
   */
  unregisterRoutes(plugin) {
    this.routes = this.routes.filter(r => r.plugin !== plugin.name);
  }

  /**
   * Отримання всіх маршрутів
   */
  getRoutes() {
    return this.routes.filter(r => {
      const plugin = this.plugins.get(r.plugin);
      return plugin && plugin.enabled;
    });
  }

  /**
   * Реєстрація сторінок адмін-панелі
   */
  registerAdminPages(plugin) {
    for (const [path, component] of Object.entries(plugin.adminPages)) {
      this.adminPages.set(path, {
        plugin: plugin.name,
        component,
        config: plugin.adminPages[`${path}:config`] || {}
      });
    }
  }

  /**
   * Видалення сторінок адмін-панелі
   */
  unregisterAdminPages(plugin) {
    for (const [path, page] of this.adminPages.entries()) {
      if (page.plugin === plugin.name) {
        this.adminPages.delete(path);
      }
    }
  }

  /**
   * Отримання сторінок адмін-панелі
   */
  getAdminPages() {
    const pages = {};
    
    for (const [path, page] of this.adminPages.entries()) {
      const plugin = this.plugins.get(page.plugin);
      if (plugin && plugin.enabled) {
        pages[path] = page;
      }
    }
    
    return pages;
  }

  /**
   * Реєстрація middleware
   */
  registerMiddleware(plugin) {
    for (const mw of plugin.middleware) {
      this.middleware.push({
        plugin: plugin.name,
        middleware: mw
      });
      
      this.cms.use(mw);
    }
  }

  /**
   * Видалення middleware
   */
  unregisterMiddleware(plugin) {
    this.middleware = this.middleware.filter(m => m.plugin !== plugin.name);
  }

  /**
   * Завантаження плагінів з конфігурації
   */
  async loadPlugins() {
    // TODO: Завантаження плагінів з файлової системи або бази даних
    // Приклад завантаження з package.json або cms.config.js
    
    const pluginsToLoad = this.cms.config.plugins || [];
    
    for (const pluginConfig of pluginsToLoad) {
      try {
        let pluginModule;
        
        if (typeof pluginConfig === 'string') {
          pluginModule = require(pluginConfig);
        } else if (typeof pluginConfig === 'object' && pluginConfig.name) {
          pluginModule = require(pluginConfig.name);
        }
        
        if (pluginModule && pluginModule.default) {
          this.register(pluginModule.default);
          await this.install(pluginModule.default.name);
        }
      } catch (error) {
        console.error(`Failed to load plugin: ${pluginConfig}`, error.message);
      }
    }
  }

  /**
   * Отримання інформації про плагін
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Отримання всіх плагінів
   */
  getPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Отримання встановлених плагінів
   */
  getInstalledPlugins() {
    return this.getPlugins().filter(p => p.installed);
  }

  /**
   * Отримання активних плагінів
   */
  getEnabledPlugins() {
    return this.getPlugins().filter(p => p.enabled);
  }

  /**
   * Перевірка наявності плагіна
   */
  hasPlugin(name) {
    return this.plugins.has(name);
  }

  /**
   * Отримання доступних хуків
   */
  getAvailableHooks() {
    return Array.from(this.hooks.keys());
  }

  /**
   * Експорт конфігурації плагінів
   */
  exportConfig() {
    return {
      plugins: this.getPlugins().map(p => ({
        name: p.name,
        version: p.version,
        installed: p.installed,
        enabled: p.enabled,
        config: p.config
      }))
    };
  }

  /**
   * Імпорт конфігурації плагінів
   */
  importConfig(config) {
    if (config.plugins) {
      for (const pluginConfig of config.plugins) {
        const plugin = this.plugins.get(pluginConfig.name);
        
        if (plugin) {
          if (pluginConfig.installed && !plugin.installed) {
            this.install(pluginConfig.name);
          }
          
          if (pluginConfig.enabled && !plugin.enabled) {
            this.activate(pluginConfig.name);
          }
          
          if (!pluginConfig.enabled && plugin.enabled) {
            this.deactivate(pluginConfig.name);
          }
          
          if (pluginConfig.config) {
            plugin.config = { ...plugin.config, ...pluginConfig.config };
          }
        }
      }
    }
    
    return this;
  }
}

module.exports = PluginSystem;
