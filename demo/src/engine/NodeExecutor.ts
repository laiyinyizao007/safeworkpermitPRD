import { EventEmitter } from 'events';

export interface ExecutionContext {
  data: Record<string, any>;
  state: string;
  currentNodeId: string;
  variables: Map<string, any>;
}

export interface NodeDefinition {
  nodeId: string;
  nodeRef: string;
  position: { x: number; y: number };
}

export interface EdgeDefinition {
  from: string;
  to: string;
  condition?: string;
}

export class NodeExecutor extends EventEmitter {
  private context: ExecutionContext;
  private nodeLibrary: Map<string, any>;

  constructor(initialData: Record<string, any>) {
    super();
    this.context = {
      data: initialData,
      state: 'Draft',
      currentNodeId: '',
      variables: new Map()
    };
    this.nodeLibrary = new Map();
  }

  async loadNodeLibrary(config: any) {
    const layers = ['layer1_universal', 'layer2_business', 'layer3_industry', 'layer4_plugins'];
    layers.forEach(layer => {
      config.nodeLibrary[layer]?.nodes.forEach((node: any) => {
        this.nodeLibrary.set(node.id, node);
      });
    });
  }

  async executeNode(nodeId: string): Promise<boolean> {
    this.context.currentNodeId = nodeId;
    const node = this.nodeLibrary.get(nodeId);

    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.emit('nodeStart', { nodeId, type: node.type });

    try {
      const result = await this.executeByType(node);
      this.emit('nodeComplete', { nodeId, result });
      return result;
    } catch (error) {
      this.emit('nodeError', { nodeId, error });
      throw error;
    }
  }

  private async executeByType(node: any): Promise<boolean> {
    switch (node.type) {
      case 'FormFieldNode':
        return this.executeFormField(node);
      case 'RuleNode':
        return this.executeRule(node);
      case 'ApprovalNode':
        return this.executeApproval(node);
      case 'IoTNode':
        return this.executeIoT(node);
      default:
        return true;
    }
  }

  private executeFormField(node: any): boolean {
    return Object.keys(this.context.data).length > 0;
  }

  private executeRule(node: any): boolean {
    const { rules } = node.config;
    for (const rule of rules) {
      if (this.evaluateCondition(rule.condition)) {
        this.applyAction(rule.action, rule.params);
      }
    }
    return true;
  }

  private executeApproval(node: any): boolean {
    return this.context.variables.get('approved') === true;
  }

  private executeIoT(node: any): boolean {
    return this.context.variables.get('iotDataValid') === true;
  }

  private evaluateCondition(condition: string): boolean {
    try {
      const fn = new Function('data', `return ${condition}`);
      return fn(this.context.data);
    } catch {
      return false;
    }
  }

  private applyAction(action: string, params: any) {
    if (action === 'setApprovalLevel') {
      this.context.variables.set('approvalLevel', params.level);
    }
  }

  getContext(): ExecutionContext {
    return this.context;
  }
}
