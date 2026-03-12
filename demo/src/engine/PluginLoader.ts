export interface PluginConfig {
  id: string;
  nodeRef: string;
  pluginPackage: string;
  config: Record<string, any>;
}

export interface PluginModule {
  execute: (context: any) => Promise<boolean>;
  validate?: (context: any) => Promise<boolean>;
}

export class PluginLoader {
  private loadedPlugins: Map<string, PluginModule>;

  constructor() {
    this.loadedPlugins = new Map();
  }

  async loadPlugin(pluginPackage: string): Promise<PluginModule | null> {
    if (this.loadedPlugins.has(pluginPackage)) {
      return this.loadedPlugins.get(pluginPackage)!;
    }

    try {
      const module = await import(/* @vite-ignore */ pluginPackage);
      this.loadedPlugins.set(pluginPackage, module.default);
      return module.default;
    } catch (error) {
      console.error(`Failed to load plugin: ${pluginPackage}`, error);
      return null;
    }
  }

  async executePlugin(pluginPackage: string, context: any): Promise<boolean> {
    const plugin = await this.loadPlugin(pluginPackage);
    if (!plugin) return false;

    return await plugin.execute(context);
  }

  unloadPlugin(pluginPackage: string): void {
    this.loadedPlugins.delete(pluginPackage);
  }
}
