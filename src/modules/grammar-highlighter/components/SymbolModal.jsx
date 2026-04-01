import React from 'react'
import { X } from 'lucide-react'

export const SYMBOLS = [
  { sym: '()', brief: '主语容器', lang: 'JS 函数调用', detail: '主语名词短语作为"函数名"，其子成分（谓语、修饰语等）作为函数体展开。无修饰时括号为空 NP()，有内联参数时括号内填入。', example: 'The manager ()\n    approved\n        the proposal' },
  { sym: '[]', brief: '助动词装饰器', lang: 'Python 装饰器', detail: '将非词汇性语法词（时态助动词、情态动词、否定词）包裹在方括号内，附着在主动词之前。括号内的词不参与语义，仅表示语法标记。', example: '[will be]enforced\n[would have]acted\n[had to]work(faster)' },
  { sym: '#', brief: '前置从句声明', lang: 'C 预处理指令', detail: '句首的状语从句（条件、让步、时间、原因、分词、独立主格）用 # 标记为"前置声明"，声明在主句之前但作用于主句。', example: '#If he had known the truth\n#Having reviewed all evidence\n#The meeting over' },
  { sym: ',', brief: '逻辑修饰语', lang: '函数参数分隔符', detail: '句末或句中修饰整个主句的连接词或介词短语，以逗号作为前缀符号。表达逻辑关系而非态度。', example: ',regardless of\n,by (施动者)\n,once\n,despite' },
  { sym: '@', brief: '全句评注修饰语', lang: 'Java/Python 注解', detail: '说话者对整句的态度性评价副词（frankly, surprisingly, obviously 等）。区别于逗号修饰语：@ 表达说话者主观态度，不表达逻辑关系。', example: '@Frankly\n@surprisingly\n@Obviously' },
  { sym: '=', brief: '同位语 / 别名', lang: '赋值运算符', detail: '同位语或别名用 = 标注在括号内，表示"等价于"的关系。也用于双宾语结构中指向直接宾语。', example: 'London (= the capital of England)\nthe company.gave(employees)\n    = a generous bonus' },
  { sym: '→', brief: '目的 / 结果', lang: '箭头函数 / 管道', detail: 'so that 引导的目的或结果从句，用箭头替代连接词，表示"前因导致后果"的单向推导关系。', example: 'the process → everyone could understand it' },
  { sym: '<>', brief: '固定搭配配对', lang: 'HTML/XML 标签', detail: '倒装或固定关联结构（not only...but also, neither...nor 等）用尖括号标记开闭配对，强调两个成分必须成对出现。', example: '<Not only>\n    ...\n<\\/but also>' },
  { sym: '.', brief: 'OOP 方法调用', lang: '面向对象方法调用', detail: '双宾语动词（give, tell, show, send 等）用 OOP 风格表示：间接宾语作为方法的参数，直接宾语用 = 赋值。', example: 'the company.gave(employees)\n    = a generous bonus' },
  { sym: '{}', brief: '名词短语枚举', lang: '集合 / 对象字面量', detail: '同级名词短语的枚举并列（and/or 连接的列表）。区别于 and( 从句级并列，{ } 专用于纯名词短语级别的集合。', example: ',due to {\n    poor planning,\n    lack of funding,\n    miscommunication\n}' },
  { sym: '~', brief: '近似 / 例举', lang: '正则近似匹配', detail: 'such as、including、like、for example 等引导的非穷举例举，用 ~ 替代引导词。表示"近似列举，非完全枚举"。', example: 'several factors (~ cost, timing, location)\nlarge cities (~ London, New York, Tokyo)' },
  { sym: '|', brief: '互斥选择', lang: '位运算 OR / 管道', detail: 'either...or、neither...nor、between...and 等互斥二选一结构。区别于 { }（开放集合），| 强调非此即彼的排他性选择。', example: 'approve | reject\nstaying | leaving' },
]

export function SymbolModal({ sym, onClose }) {
  if (!sym) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-blue-500 dark:text-blue-400">{sym.sym}</span>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{sym.brief}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">灵感来源：{sym.lang}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={15} /></button>
        </div>
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{sym.detail}</p>
        </div>
        <div className="mx-4 mb-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider font-medium">示例</p>
          <pre className="font-mono text-xs text-slate-700 dark:text-slate-200 whitespace-pre leading-relaxed">{sym.example}</pre>
        </div>
      </div>
    </div>
  )
}
