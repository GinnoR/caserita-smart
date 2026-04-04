const { execSync } = require('child_process');
const fs = require('fs');

try {
  const status = execSync('git status', { encoding: 'utf8' });
  const remote = execSync('git remote -v', { encoding: 'utf8' });
  const branch = execSync('git branch', { encoding: 'utf8' });
  
  fs.writeFileSync('git_diagnosis.log', `BRANCH:\n${branch}\n\nREMOTE:\n${remote}\n\nSTATUS:\n${status}`);
} catch (err) {
  fs.writeFileSync('git_diagnosis.log', `ERROR: ${err.message}`);
}
