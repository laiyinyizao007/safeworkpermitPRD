import jexl from 'jexl';

export interface Rule {
  condition: string;
  action: string;
  params: Record<string, any>;
}

export class RuleEngine {
  private jexl: any;

  constructor() {
    this.jexl = new jexl.Jexl();
  }

  async evaluate(condition: string, context: Record<string, any>): Promise<boolean> {
    try {
      return await this.jexl.eval(condition, context);
    } catch (error) {
      console.error('Rule evaluation error:', error);
      return false;
    }
  }

  async executeRules(rules: Rule[], context: Record<string, any>): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const rule of rules) {
      const matched = await this.evaluate(rule.condition, context);
      if (matched) {
        results.set(rule.action, rule.params);
      }
    }

    return results;
  }

  // 审批级别匹配
  async matchApprovalLevel(workLevel: string): Promise<number> {
    const rules: Rule[] = [
      { condition: "workLevel == 'special'", action: 'setApprovalLevel', params: { level: 3 } },
      { condition: "workLevel == 'level1'", action: 'setApprovalLevel', params: { level: 2 } },
      { condition: "workLevel == 'level2'", action: 'setApprovalLevel', params: { level: 1 } }
    ];

    const results = await this.executeRules(rules, { workLevel });
    return results.get('setApprovalLevel')?.level || 1;
  }
}
