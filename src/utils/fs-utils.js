const { promises: fs, constants } = require('fs');
const path = require('path');

async function validateAndPrepareOutputDir(dirPath) {
  const absolutePath = path.resolve(dirPath);

  try {
    // Attempt to create the directory recursively
    await fs.mkdir(absolutePath, { recursive: true });

    // Check for write access
    await fs.access(absolutePath, constants.W_OK);

    // If it's a file, throw an error
    const stats = await fs.stat(absolutePath);
    if (stats.isFile()) {
      throw new Error(`Path '${absolutePath}' exists but is a file, not a directory. Please provide a directory path.`);
    }

    return absolutePath; // Return the absolute path on success
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: Cannot write to '${absolutePath}'. Please check folder permissions.`);
    }
    if (error.code === 'EEXIST' && (await fs.stat(absolutePath)).isFile()) {
        throw new Error(`Path '${absolutePath}' exists but is a file, not a directory. Please provide a directory path.`);
    }
    // Catch the specific error when fs.stat fails after mkdir due to it being a file
    if (error.message.includes('not a directory') && error.code === 'EEXIST') { // This case can happen if mkdir {recursive:true} succeeds on a pre-existing file.
      throw new Error(`Path '${absolutePath}' exists but is a file, not a directory. Please provide a directory path.`);
    }

    throw new Error(`Failed to access or create output directory '${absolutePath}': ${error.message}`);
  }
}

module.exports = { validateAndPrepareOutputDir };
