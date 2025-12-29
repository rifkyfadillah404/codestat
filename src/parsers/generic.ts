export interface ParseResult {
  code: number;
  comments: number;
  blank: number;
  total: number;
}

interface CommentSyntax {
  single: string[];
  multiStart: string[];
  multiEnd: string[];
}

const COMMENT_SYNTAX: Record<string, CommentSyntax> = {
  default: {
    single: ['//'],
    multiStart: ['/*'],
    multiEnd: ['*/'],
  },
  python: {
    single: ['#'],
    multiStart: ['"""', "'''"],
    multiEnd: ['"""', "'''"],
  },
  ruby: {
    single: ['#'],
    multiStart: ['=begin'],
    multiEnd: ['=end'],
  },
  html: {
    single: [],
    multiStart: ['<!--'],
    multiEnd: ['-->'],
  },
  shell: {
    single: ['#'],
    multiStart: [],
    multiEnd: [],
  },
  sql: {
    single: ['--'],
    multiStart: ['/*'],
    multiEnd: ['*/'],
  },
  lua: {
    single: ['--'],
    multiStart: ['--[['],
    multiEnd: [']]'],
  },
};

function getCommentSyntax(language: string): CommentSyntax {
  const lang = language.toLowerCase();
  
  if (lang === 'python') return COMMENT_SYNTAX.python;
  if (lang === 'ruby') return COMMENT_SYNTAX.ruby;
  if (['html', 'xml', 'markdown'].includes(lang)) return COMMENT_SYNTAX.html;
  if (['shell', 'bash', 'yaml', 'dockerfile'].includes(lang)) return COMMENT_SYNTAX.shell;
  if (lang === 'sql') return COMMENT_SYNTAX.sql;
  if (lang === 'lua') return COMMENT_SYNTAX.lua;
  
  return COMMENT_SYNTAX.default;
}

export function parseContent(content: string, language: string): ParseResult {
  const lines = content.split('\n');
  const syntax = getCommentSyntax(language);
  
  let code = 0;
  let comments = 0;
  let blank = 0;
  let inMultiLineComment = false;
  let multiEndPattern = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      blank++;
      continue;
    }

    if (inMultiLineComment) {
      comments++;
      if (trimmed.includes(multiEndPattern)) {
        inMultiLineComment = false;
        multiEndPattern = '';
      }
      continue;
    }

    let isComment = false;

    for (const single of syntax.single) {
      if (trimmed.startsWith(single)) {
        isComment = true;
        break;
      }
    }

    if (!isComment) {
      for (let i = 0; i < syntax.multiStart.length; i++) {
        if (trimmed.includes(syntax.multiStart[i])) {
          isComment = true;
          if (!trimmed.includes(syntax.multiEnd[i]) || 
              trimmed.indexOf(syntax.multiStart[i]) > trimmed.indexOf(syntax.multiEnd[i])) {
            inMultiLineComment = true;
            multiEndPattern = syntax.multiEnd[i];
          }
          break;
        }
      }
    }

    if (isComment) {
      comments++;
    } else {
      code++;
    }
  }

  return {
    code,
    comments,
    blank,
    total: lines.length,
  };
}
