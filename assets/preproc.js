

module.exports = (markdown, options) => {
  return new Promise((resolve, reject) => {
    var isComment = false;
    var isFence = null; // currently open fenced code block marker ('`' or '~'), if any
    return resolve(
      (options.makeTitle ? `
<p style="font-size: 16px; color: #999; margin:5px; position: absolute;"><a href="..">Homepage</a> | <a href="?print-pdf">Printable Version</a></p>
<div style="display: flex; justify-content: center; align-items: center; height: 700px;">
  <div style="text-align: center; padding: 40px; background-color: white; border: 2px solid rgb(0, 63, 163); border-radius: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
    <h1 style="font-size: 48px; font-weight: bold; margin-bottom: 20px; color: #333;">${options.makeTitle.lecture || "请设置 makeTitle.lecture"}</h1>
    <p style="font-size: 24px; color: #666;">${options.makeTitle.title || "请设置 makeTitle.title"}</p>
    <p style="font-size: 16px; color: #999; margin-top: 20px; margin-bottom:5px">${options.makeTitle.detail || "请设置 makeTitle.detail"}</p>
  </div>
</div>\n\n<!--s-->\n\n` : "")
      +
      markdown
        .split('\n')
        // .map((line, index) => {
        //   if (line.includes("<!--")) isComment = true;
        //   if (line.includes("-->")) isComment = false;
        //   if (!options.autoFragment) return line;
        //   if (!/^\s*[-*] /.test(line) || index === 0) return line;
        //   if (isComment) return line;
        //   return line.replace(/^(\s*)[-*] (.*)/, "$1- <span> $2 </span>") + ' <!-- .element: class="fragment" -->';
        // })
        .map((line, index) => {
          // Track fenced code blocks (``` or ~~~) FIRST, so that a "# " line
          // inside code (e.g. a Python/shell comment) is never treated as a
          // heading. The opening fence may carry an info string (```bash).
          const fence = line.match(/^\s*(`{3,}|~{3,})/);
          if (fence) {
            if (!isFence) isFence = fence[1][0];
            else if (fence[1][0] === isFence) isFence = null;
            return line;
          }
          if (isFence) return line;
          // Track HTML comments (<!-- -->), e.g. the <!--s-->/<!--v--> separators.
          if (line.includes('<!--')) isComment = true;
          if (line.includes('-->')) isComment = false;
          if (isComment) return line;
          if (!options.autoTitlePage) return line;
          if (!line.startsWith('# ')) return line;
          return '<div class="middle center"><div style="width: 100%">\n\n' + line + '\n\n</div></div>';
        })
        .join('\n')
      +
      (options.makeThanks ? `

<!--s-->

<div style="display: flex; justify-content: center; align-items: center; height: 700px;   ">
  <div style="text-align: center; padding: 40px; background-color: white; border-radius: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
    <div style="display: inline-block; padding: 20px 40px; border-radius: 10 px; margin-bottom: 20px;">
      <h1 style="font-size: 48px; font-weight: bold; margin: 0; color: rgb(16, 33, 89)">Thanks for Listening</h1>
    </div>
    <p style="font-size: 24px; color: #666; margin: 0;">Any questions?</p>
  </div>
</div>`: "")
    );
  });
};