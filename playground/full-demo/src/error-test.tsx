// 这个文件包含故意的语法错误用于测试错误页面增强功能
import React from 'react';

// 故意的语法错误：缺少括号
const ErrorComponent = () => {
  const [count, setCount] = useState(0);  // useState 没有从 React 导入

  // 故意的语法错误：缺少闭合括号
  const badSyntax = {
    prop1: 'value1',
    prop2: 'value2',
  // 缺少闭合括号

  return (
    <div>
      <h1>Error Test Component</h1>
      <p>This will cause a syntax error</p>
    </div>
  );
};

export default ErrorComponent;