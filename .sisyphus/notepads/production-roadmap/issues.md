问题记录 - production-roadmap Task 1

- 初始状态: package.json peerDependencies 声明为 "typescript": "^5"，devDependencies 仅有 "@types/bun": "latest"。
- 风险: 某些环境可能需要精确的 typescript 版本来满足 @types/bun 的类型声明，导致 peerDependency 警告或安装失败。
- 处理动作: 将 typescript 添加到 devDependencies，且将 peerDependencies 更改为 ">=5.0.0 <6.0.0"。

后续建议:
- 若未来遇到其他 peerDependency 报错，优先审查哪个包需要特定次版本并适当放宽或固定版本。
