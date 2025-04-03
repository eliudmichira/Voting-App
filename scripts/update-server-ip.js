/**
 * Server IP Update Script
 * 
 * This script helps update the server IP address in both app.json and App.jsx
 * making it easier to connect Expo to the Node.js server running on your computer.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Function to get all local IP addresses (excluding localhost)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const ifaceName in interfaces) {
    const iface = interfaces[ifaceName];
    for (const entry of iface) {
      // Skip internal, non-IPv4 addresses
      if (entry.internal === false && entry.family === 'IPv4') {
        addresses.push({
          name: ifaceName,
          address: entry.address
        });
      }
    }
  }
  
  return addresses;
}

// Get the IP addresses
const ipAddresses = getLocalIpAddresses();

console.log('\n🌐 Local Network IP Addresses:\n');
ipAddresses.forEach((ip, index) => {
  console.log(`  [${index + 1}] ${ip.address} (${ip.name})`);
});

// Prompt for IP selection
console.log('\nSelect the IP address that your mobile device and computer share (on the same WiFi network).');
console.log('Enter the number of the IP you want to use:');

// Read user input using standard input
process.stdin.once('data', async (data) => {
  const selection = parseInt(data.toString().trim(), 10);
  
  if (isNaN(selection) || selection < 1 || selection > ipAddresses.length) {
    console.error('❌ Invalid selection. Please run the script again and select a valid option.');
    process.exit(1);
  }
  
  const selectedIp = ipAddresses[selection - 1].address;
  const port = 8080; // Default port
  const serverUrl = `http://${selectedIp}:${port}`;
  
  console.log(`\n🔄 Updating server URL to: ${serverUrl}`);
  
  // Update app.json
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Update the serverUrl
    appJson.expo.extra.serverUrl = serverUrl;
    
    // Write the updated file
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json');
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
  }
  
  // Update App.jsx
  try {
    const appJsxPath = path.join(__dirname, '..', 'App.jsx');
    let appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
    
    // Replace the devServerUrl line
    appJsxContent = appJsxContent.replace(
      /const devServerUrl = ['"]http:\/\/[^:]+:\d+['"];/,
      `const devServerUrl = '${serverUrl}'; // Updated by script on ${new Date().toLocaleString()}`
    );
    
    // Write the updated file
    fs.writeFileSync(appJsxPath, appJsxContent);
    console.log('✅ Updated App.jsx');
  } catch (error) {
    console.error('❌ Error updating App.jsx:', error.message);
  }
  
  console.log('\n✨ Update complete! You can now run the Expo app with:');
  console.log('  npm run expo-start-lan\n');
  
  process.exit(0);
}); 