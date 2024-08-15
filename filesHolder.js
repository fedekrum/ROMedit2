/**
 * Class responsible for handling file operations, including hashing,
 * file storage, and ZIP file generation.
 */
class FilesHolder {

  /**
   * Constructor to initialize the FilesHolder instance.
   * Initializes an empty array for files, sets the default ZIP file name,
   * and the default hash algorithm.
   */
  constructor() {
    /**
     * @property {Array<Object>} files - Array to hold file objects.
     */
    this.files = [];

    /**
     * @property {string} zipFileName - The default name for the generated ZIP file.
     */
    this.zipFileName = "ROMedit.zip";

    /**
     * @property {string} hashAlgorithm - The default hash algorithm ('SHA-1' or 'MD5').
     */
    this.hashAlgorithm = "SHA-1";
  }

  /**
   * Sets the hash algorithm to be used for file hashing.
   * 
   * @param {string} algorithm - The hash algorithm ('SHA-1' or 'MD5').
   */
  setHashAlgorithm(algorithm) {
    this.hashAlgorithm = algorithm;
  }

  /**
   * Calculates the hash (SHA-1 or MD5) for a given ArrayBuffer.
   * 
   * @param {ArrayBuffer} arrayBuffer - The buffer to hash.
   * @returns {Promise<string>} - The hexadecimal string representation of the hash.
   * @throws Will throw an error if the hashing process fails.
   */
  async calculateHash(arrayBuffer) {
    try {
      if (this.hashAlgorithm === "SHA-1") {
        const shaObj = new jsSHA("SHA-1", "ARRAYBUFFER");
        shaObj.update(arrayBuffer);
        return shaObj.getHash("HEX");
      } else if (this.hashAlgorithm === "MD5") {
        return md5(arrayBuffer); // Using md5.min.js library for MD5 hashing
      }
    } catch (error) {
      console.error(`Error calculating ${this.hashAlgorithm} hash:`, error);
      throw error;
    }
  }

  /**
   * Recalculates the hash for all files using the currently selected hash algorithm.
   * 
   * @returns {Promise<void>}
   */
  async recalculateAllHashes() {
    try {
      for (const file of this.files) {
        file.originalHash = await this.calculateHash(file.originalData.buffer);
        file.editableHash = await this.calculateHash(file.editableData.buffer);
      }
    } catch (error) {
      console.error(`Error recalculating ${this.hashAlgorithm} hashes:`, error);
    }
  }

  /**
   * Adds a file to the files array, handles both regular files and ZIP archives.
   * 
   * @param {File} file - The file object to be added.
   * @returns {Promise<void>}
   * @throws Will throw an error if the file cannot be added.
   */
  async addFile(file) {
    try {
      if (file.name.startsWith(".")) {
        console.log(`Skipping invisible file: ${file.name}`);
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const originalHash = await this.calculateHash(arrayBuffer);

      if (file.type === "application/zip") {
        this.zipFileName = file.name;
        await this.addZipFile(file, uint8Array);
      } else {
        this.files.push({
          name: file.name,
          size: file.size,
          type: file.type,
          originalHash: originalHash,
          editableHash: originalHash,
          zipFileName: null,
          originalData: uint8Array,
          editableData: uint8Array.slice(),
        });
      }
    } catch (error) {
      console.error("Error adding file:", error);
      throw error;
    }
  }

  /**
   * Handles the extraction and processing of files within a ZIP archive.
   * 
   * @param {File} file - The original ZIP file.
   * @param {Uint8Array} uint8Array - The file data as a Uint8Array.
   * @returns {Promise<void>}
   * @throws Will throw an error if the ZIP file cannot be processed.
   */
  async addZipFile(file, uint8Array) {
    try {
      const zip = await JSZip.loadAsync(uint8Array.buffer);
      let firstValidFileAdded = false;

      for (let fileName in zip.files) {
        if (!zip.files[fileName].dir && !fileName.startsWith(".")) {
          const zipFileData = await zip.files[fileName].async("uint8array");
          const originalHash = await this.calculateHash(zipFileData.buffer);

          this.files.push({
            name: fileName,
            size: zip.files[fileName]._data.uncompressedSize,
            type: "unknown",
            originalHash: originalHash,
            editableHash: originalHash,
            zipFileName: file.name,
            originalData: zipFileData,
            editableData: zipFileData.slice(),
          });

          if (!firstValidFileAdded) {
            firstValidFileAdded = true;
            updateFileSelect();
            fileSelect.value = fileName;
            displayFileInfo(fileName);
          }
        }
      }
    } catch (error) {
      console.error("Error adding ZIP file:", error);
      throw error;
    }
  }

  /**
   * Updates the hash for the editable data of a specific file.
   * 
   * @param {string} fileName - The name of the file to update.
   * @returns {Promise<void>}
   * @throws Will throw an error if the file cannot be found or if hashing fails.
   */
  async updateEditableHash(fileName) {
    try {
      const file = this.files.find((f) => f.name === fileName);
      if (file) {
        const editableHash = await this.calculateHash(file.editableData.buffer);
        file.editableHash = editableHash;
      } else {
        throw new Error(`File with name "${fileName}" not found.`);
      }
    } catch (error) {
      console.error(`Error updating ${this.hashAlgorithm} hash:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all stored files.
   * 
   * @returns {Array<Object>} - An array of file objects.
   */
  getFiles() {
    return this.files;
  }

  /**
   * Retrieves the names of all stored files.
   * 
   * @returns {Array<string>} - An array of file names.
   */
  getFileNames() {
    return this.files.map((file) => file.name);
  }

  /**
   * Clears all stored files from the instance.
   */
  clearFiles() {
    this.files = [];
  }

  /**
   * Generates a ZIP file containing all stored files.
   * 
   * @returns {Promise<Blob>} - A Blob representing the generated ZIP file.
   * @throws Will throw an error if ZIP file generation fails.
   */
  async generateZipFile() {
    try {
      const zip = new JSZip();

      this.files.forEach((file) => {
        zip.file(file.name, file.editableData);
      });

      return await zip.generateAsync({ type: "blob" });
    } catch (error) {
      console.error("Error generating ZIP file:", error);
      throw error;
    }
  }

  /**
   * Retrieves the name of the ZIP file to be generated.
   * 
   * @returns {string} - The name of the ZIP file.
   */
  getZipFileName() {
    return this.zipFileName;
  }

  /**
   * Retrieves a specific file by its name.
   * 
   * @param {string} fileName - The name of the file to retrieve.
   * @returns {Object|null} - The file object, or null if not found.
   */
  getFile(fileName) {
    return this.files.find((file) => file.name === fileName);
  }
}
