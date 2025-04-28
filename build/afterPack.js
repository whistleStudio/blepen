const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
  const appOutDir = context.appOutDir;
  const localesDir = path.join(appOutDir, 'locales');

  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);

    files.forEach(file => {
      if (!file.startsWith('zh-CN')) {
        fs.unlinkSync(path.join(localesDir, file));
      }
    });

    console.log('Locales cleanup completed. Only Chinese-CN locale is retained.');
  } else {
    console.log('Locales directory not found.');
  }
};