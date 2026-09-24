const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

// The route mapping based on our refactor
const routeMappings = {
  // Auth
  '/register': '/auth/register',
  '/login': '/auth/login',
  '/change-password': '/auth/change-password',
  
  // Alumni
  '/member/': '/alumni/member/',
  '/member/update/': '/alumni/member/update/',
  '/alumni': '/alumni', // Was /alumni before, now /api/alumni, but in code it was axios.get(\`\${API_URL}/alumni\`) -> so now it's just /alumni but wait, /alumni becomes /api/alumni. The mapping means we replace the old endpoint string with the new.
  // Actually, wait, the old axios calls were like \`\${API_URL}/alumni\`
  // Now API_URL ends with /api. So \`\${API_URL}/alumni\` correctly maps to /api/alumni. NO CHANGE NEEDED for /alumni, /forum, /admin, /contributions.
  
  // Routes that DID change their prefix:
  '/member/': '/alumni/member/',
  '/alumni/profile/': '/alumni/profile/', // no change needed
  '/privacy/': '/alumni/privacy/',
  '/birthdays/today': '/alumni/birthdays/today',
  
  '/event-gallery/': '/events/gallery/',
  '/rsvp': '/events/rsvp',
  
  '/mentors': '/contributions/mentors',
  '/mentorship/request': '/contributions/mentorship/request',
  
  '/banner-request/mine/': '/banners/mine/',
  '/banner-request': '/banners/request',
  '/banners/active': '/banners/active',
  
  // Pay
  '/pay/initiate': '/pay/initiate' // no change needed
};

// Function to recursively find all files
const getAllFiles = function(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      // Exclude node_modules, .git, etc.
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      // Only process .ts and .tsx files
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
};

const files = getAllFiles(frontendDir);
let changedFilesCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  const prefixes = ['API', 'API_URL', 'API_BASE'];
  
  prefixes.forEach(prefix => {
    // Auth
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/login", 'g'), "${" + prefix + "}/auth/login");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/register", 'g'), "${" + prefix + "}/auth/register");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/change-password", 'g'), "${" + prefix + "}/auth/change-password");
    
    // Alumni
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/member/", 'g'), "${" + prefix + "}/alumni/member/");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/privacy/", 'g'), "${" + prefix + "}/alumni/privacy/");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/birthdays/today", 'g'), "${" + prefix + "}/alumni/birthdays/today");
    
    // Events
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/event-gallery/", 'g'), "${" + prefix + "}/events/gallery/");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/rsvp", 'g'), "${" + prefix + "}/events/rsvp");
    
    // Contributions
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/mentors", 'g'), "${" + prefix + "}/contributions/mentors");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/mentorship/request", 'g'), "${" + prefix + "}/contributions/mentorship/request");
    
    // Banners
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/banner-request/mine/", 'g'), "${" + prefix + "}/banners/mine/");
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/banner-request", 'g'), "${" + prefix + "}/banners/request");
    // Revert double replacements if any
    content = content.replace(new RegExp("\\\\$\\\\{" + prefix + "\\\\}/banners/request/mine/", 'g'), "${" + prefix + "}/banners/mine/");
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFilesCount++;
    console.log("Updated: " + file);
  }
});

console.log("Done! Updated " + changedFilesCount + " files.");
