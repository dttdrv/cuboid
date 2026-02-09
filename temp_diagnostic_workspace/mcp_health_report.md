# MCP Server Health Diagnostic

## 🚨 Critical Instability Confirmed

### 1. Qwen Council (`mcp_qwen-council`)
- **Status**: 🔴 **CRITICAL FAIL (HANG)**
- **Observation**: Request to `review_plan_logic` resulted in a timeout/hang, requiring user cancellation.
- **Impact**: Tool is effectively unusable for interactive blocking tasks.

### 2. Antigravity Foreman (GLM) (`mcp_antigravity-foreman`)
- **Status**: 🟠 **UNSTABLE (Protocol Error)**
- **Observation**: Response to simple Ping was received, but failed input/output parsing (`No valid <file> tags`).
- **User Report**: User indicates this tool also hangs on complex tasks.
- **Risk**: High probability of hanging on larger payloads or valid code generation requests.

### 3. System Resource Check
- **Analysis**: Check active process list for stuck python/node instances.
- **Zombie Processes**: High memory usage observed in previous checks.

## Recommendations
1. **Immediate**: Avoid using `qwen-council` for critical path checks.
2. **Workaround**: Use manual "Architect" verification instead of `review_plan_logic`.
3. **Mitigation**: Restart the MCP host process or IDE to clear potential zombie processes.
