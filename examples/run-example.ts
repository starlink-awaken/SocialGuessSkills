import { runWorkflow } from "../src/workflow/orchestrator.js";
import exampleInput from "./community-governance.json" with { type: "json" };

async function runExample() {
  console.log("=== 社区治理模型推演示例 ===");
  console.log("输入假设:", JSON.stringify(exampleInput.hypothesis, null, 2));
  
  try {
    const model = await runWorkflow(exampleInput.hypothesis, exampleInput.options);
    
    console.log("\n=== 推演完成 ===");
    console.log(`迭代次数: ${model.metadata.iterations}`);
    console.log(`置信度: ${model.metadata.confidence.toFixed(2)}`);
    console.log(`Agent输出数量: ${model.agentOutputs.length}`);
    console.log(`冲突数量: ${model.conflicts.length}`);
    
    if (model.agentOutputs.length > 0) {
      console.log("\n=== Agent分析摘要 ===");
      model.agentOutputs.forEach(output => {
        console.log(`\n【${output.agentType} Agent】`);
        console.log(`结论: ${output.conclusion}`);
        console.log(`可证伪点: ${output.falsifiable}`);
      });
    }
    
    if (model.conflicts.length > 0) {
      console.log("\n=== 检测到的冲突 ===");
      model.conflicts.forEach((conflict, index) => {
        console.log(`\n${index + 1}. [${conflict.type}] ${conflict.description}`);
        console.log(`   严重性: ${conflict.severity}`);
        console.log(`   涉及Agent: ${conflict.involvedAgents.join(", ")}`);
      });
    }
    
    console.log("\n=== 模型结构摘要 ===");
    console.log(`总体结构层: ${Object.keys(model.structure.overall).length}个`);
    console.log(`工作流层: ${Object.keys(model.structure.workflow).length}个`);
    console.log(`制度层: ${Object.keys(model.structure.institutions).length}个`);
    
    console.log("\n=== 完整模型输出 ===");
    console.log(JSON.stringify(model, null, 2));
    
    return model;
  } catch (error) {
    console.error("示例执行失败:", error);
    process.exit(1);
  }
}

runExample();
