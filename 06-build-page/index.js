const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const templateFile = path.join(__dirname, 'template.html');
const outputDir = path.join(__dirname, 'project-dist');
const outputFile = path.join(outputDir, 'index.html');
const stylesDir = path.join(__dirname, 'styles');
const stylesOutputFile = path.join(outputDir, 'style.css');

const replaceTemplateTags = (data, callback) => {
  let newData = data;
  const regex = /\{\{(\w+)\}\}/g;
  const replaceNextTag = () => {
    const match = regex.exec(data);
    if (match) {
      const tagName = match[1];
      const componentFile = path.join(componentsDir, `${tagName}.html`);
      fs.readFile(componentFile, 'utf8', (err, componentData) => {
        if (err) {
          callback(err);
          return;
        }
        newData = newData.replace(match[0], componentData);
        replaceNextTag();
      });
    } else {
      callback(null, newData);
    }
  };
  replaceNextTag();
};

const replaceTags = (callback) => {
  fs.readFile(templateFile, 'utf8', (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    replaceTemplateTags(data, (err, newData) => {
      if (err) {
        callback(err);
        return;
      }
      fs.writeFile(outputFile, newData, (err) => {
        if (err) {
          callback(err);
          return;
        }
        console.log('index.html file created.');
        callback(null);
      });
    });
  });
};

const collectStyles = (callback) => {
  let stylesBundle = '';
  fs.readdir(stylesDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    const cssFiles = files.filter((file) => {
      return file.isFile() && path.extname(file.name) === '.css';
    });
    const readFile = (i) => {
      if (i >= cssFiles.length) {
        callback(null, stylesBundle);
        return;
      }
      const filePath = path.join(stylesDir, cssFiles[i].name);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          callback(err);
          return;
        }
        stylesBundle += data + '\n';
        readFile(i + 1);
      });
    };
    readFile(0);
  });
};

const writeStyles = (stylesBundle, callback) => {
  fs.writeFile(stylesOutputFile, stylesBundle, (err) => {
    if (err) {
      callback(err);
      return;
    }
    console.log('style.css file created.');
    callback(null);
  });
};

const copyDir = async (srcDir, destDir) => {
  try {
    await fs.promises
      .access(destDir)
      .catch(() => fs.promises.mkdir(destDir, { recursive: true }));
    const files = await fs.promises.readdir(srcDir);
    if (files.length === 0) {
      return;
    }
    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      const stat = await fs.promises.stat(srcPath);

      if (stat.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  } catch (err) {
    console.error(`An error occurred: ${err}`);
  }
};
const mainDir = path.join(__dirname, 'assets');
const dirForCopy = path.join(__dirname, 'project-dist/assets');

copyDir(mainDir, dirForCopy);

replaceTags((err) => {
  if (err) {
    console.error(err);
    return;
  }
  collectStyles((err, stylesBundle) => {
    if (err) {
      console.error(err);
      return;
    }
    writeStyles(stylesBundle, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('All completed!');
    });
  });
});
