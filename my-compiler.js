/**
 * 词法分析
 * @param {*} input 原始代码
 * @returns 词法单元数组tokens
 */
function tokenizer(input) {
  let current = 0 // 当前遍历的下标
  let tokens = [] // 用于保存词法单元的数组
  while (current < input.length) {
    // 用正则取出词法单元

    let char = input[current] // 当前字符

    // 1、匹配左括号
    if (char === '(') {
      tokens.push({
        type: 'paren',
        value: '(',
      })
      current++
      continue
    }
    // 2、匹配右括号
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      })
      current++
      continue
    }
    // 3、匹配并跳过空格
    let WHITESPACE = /\s/
    if (WHITESPACE.test(char)) {
      current++
      continue
    }
    // 4、匹配number
    let NUMBERS = /[0-9]/
    if (NUMBERS.test(char)) {
      let value = ''
      // 数字可能是由多个数字字符组成，如数字123有3个数字字符，所以这里需要遍历全部取出
      while (NUMBERS.test(char)) {
        value += char
        char = input[++current]
      }
      tokens.push({
        type: 'number',
        value
      })
      continue
    }
    // 5、匹配name
    let LETTERS = /[a-z]/i
    if (LETTERS.test(char)) {
      let value = ''
      // 和number一样，可能是多个字母组成的name，如add是由a,d,d三个字母组成的，需要遍历取出
      while (LETTERS.test(char)) {
        value += char
        char = input[++current]
      }
      tokens.push({
        type: 'name',
        value
      })
      continue
    }
  }
  return tokens
}

/**
 * 句法分析
 * @param {*} tokens 词法单元数组
 * @returns AST抽象语法树
 */
function parser(tokens) {
  function walk() {
    let token = tokens[current]
    // 处理number类型，直接返回子节点
    if (token.type === 'number') {
      current++
      return {
        type: 'NumberLiteral',
        value: token.value,
      }
    }
    // 处理string类型，直接返回子节点
    if (token.type === 'string') {
      current++
      return {
        type: 'StringLiteral',
        value: token.value,
      }
    }
    // 处理括号内的内容
    if (token.type === 'paren' && token.value === '(') {
      token = tokens[++current]
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      }
      token = tokens[++current]
      while ((token.type !== 'paren') || (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk())
        token = tokens[current]
      }
      current++
      return node
    }
  }

  let ast = {
    type: 'Program',
    body: [],
  }
  let current = 0
  while (current < tokens.length) {
    ast.body.push(walk())
  }
  return ast
}

/**
 * 转换
 * @param {*} ast 原始代码抽象语法树
 * @returns 目标代码抽象语法树
 */
function transformer(ast) {

  function traverseArray(array, newArray) {
    array.forEach(node => {
      // 每个node加一层封装
      const newAstNode = {
        type: 'ExpressionStatement',
        expression: {}
      }
      traverseNode(node, newAstNode.expression)
      newArray.push(newAstNode)
    })
  }

  function traverseNode(node, newNode) {
    switch (node.type) {
      case 'CallExpression':
        newNode.type = node.type
        const callee = {
          type: 'Identifier',
          name: node.name
        }
        newNode.callee = callee

        // 处理params
        const arguments = []
        // 递归生成子树
        node.params.forEach(item => {
          arguments.push(traverseNode(item, {}))
        })
        newNode.arguments = arguments
        break
      case 'NumberLiteral':
        newNode = {
          type: 'NumberLiteral',
          value: node.value,
        }
        break
      default:
        throw new TypeError(node.type)
    }

    return newNode
  }

  let newAst = {
    type: 'Program',
    body: [],
  }

  traverseArray(ast.body, newAst.body)

  return newAst

}

function codeGenerator(node) {
  switch (node.type) {
    case "Program":
      // 程序中可能有多行代码，每行后面加换行符
      const code = node.body.map(codeGenerator).join("\n")
      return code
    case "ExpressionStatement":
      // 每行代码后面加分号
      return codeGenerator(node.expression) + ";";
    case "CallExpression":
      // 每个函数表达式由 "方法名"+"("+"参数1,参数2,...,参数n"+)
      // 多个参数用逗号连接
      return codeGenerator(node.callee) + "(" + node.arguments.map(codeGenerator).join(", ") + ")"
    case "Identifier":
      // 直接返回方法名称
      return node.name
    case "NumberLiteral":
      // 直接返回数值
      return node.value
    default:
      throw new TypeError(node.type)
  }
}

function compiler(input) {
  const tokens = tokenizer(input)
  const ast = parser(tokens)
  const newAst = transformer(ast)
  const code = codeGenerator(newAst)
  return code
}

const input = '(add 2 (subtract 4 2))'
const output = compiler(input)
console.log(output)