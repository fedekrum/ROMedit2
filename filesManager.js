class FilesManager {
  constructor() {
    this.files = []; // Initialize files array
    this.downloadFileName = "file"; // Default download file name
  }

  /**
   * Sets the name of the downloaded file or ZIP archive.
   *
   * @param {string} downloadFileName - The desired name of the downloaded file or ZIP archive.
   * @throws {Error} If the provided name is not valid.
   * @return {void}
   */
  setDownloadFileName(downloadFileName) {
    if (!this.#isValidFileName(downloadFileName)) {
      throw new Error("Invalid file name. Must be a valid string without illegal characters.");
    }

    // Remove any trailing ".zip" extensions (case-insensitive)
    while (downloadFileName.toLowerCase().endsWith(".zip")) {
      downloadFileName = downloadFileName.slice(0, -4).trim();
    }

    // Set the final download file name
    this.downloadFileName = downloadFileName;
  }

  /**
 * Adds a file to the files array with its metadata.
 * 
 * @param {Blob} fileBlob - The binary file (BLOB) to add.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<void>} - A promise that resolves when the file is added.
 * @throws {TypeError} - If the fileBlob is not a Blob or the fileName is not a valid string.
 * @throws {Error} - If there is an error calculating hashes.
 */
  async addFile(fileBlob, fileName) {
    if (!(fileBlob instanceof Blob)) {
      throw new TypeError("Invalid file: Expected a Blob.");
    }
    if (!this.#isValidFileName(fileName)) {
      throw new TypeError("Invalid file name: The name must be a non-empty string without illegal characters.");
    }

    // Calculate the size of the file
    const size = fileBlob.size;

    // Calculate original hashes
    const originalMD5 = await this.#calculateMD5(fileBlob);
    const originalSHA1 = await this.#calculateSHA1(fileBlob);

    // Initialize the file entry with its metadata
    const fileEntry = {
      name: fileName,
      originalData: fileBlob,
      editableData: fileBlob, // Initially, editableData is a copy of originalData
      offset: 0,
      size: size,
      originalMD5: originalMD5,
      originalSHA1: originalSHA1,
      editableMD5: originalMD5,
      editableSHA1: originalSHA1,
    };

    // Add the file entry to the files array
    this.files.push(fileEntry);
  }

  /**
   * Recalculates the MD5 and SHA-1 hashes for the editable data of all files.
   *
   * @return {Promise<void>} A promise that resolves when all hashes have been recalculated.
   */
  async recalculateAllHashes() {
    // Create an array of promises that calculate the hashes
    const hashPromises = this.files.map(async (file) => {
      file.editableMD5 = await this.#calculateMD5(file.editableData);
      file.editableSHA1 = await this.#calculateSHA1(file.editableData);
    });

    // Wait for all hash calculations to complete
    await Promise.all(hashPromises);
  }

  /**
   * Retrieves an array of names of all files stored in the instance.
   *
   * @return {Array<string>} An array of file names.
   */
  getFileNames() {
    return this.files.map((file) => file.name);
  }


  /**
   * Changes a specific byte in the editableData of a specified file.
   * 
   * @param {string} fileName - The name of the file to modify.
   * @param {string} byteAddress - The byte address to change (hexadecimal string).
   * @param {string} hexValue - The new byte value (hexadecimal string, 0x00 to 0xFF).
   * @throws {Error} - If the file is not found, if the byteAddress is out of bounds, or if the hexValue is invalid.
   */
  async changeByteInFile(fileName, byteAddress, hexValue) {
    // Validate the file name
    const file = this.files.find(f => f.name === fileName);
    if (!file) {
      throw new Error(`File '${fileName}' not found.`);
    }

    // Convert byteAddress and hexValue to integers
    const address = parseInt(byteAddress, 16);
    const newValue = parseInt(hexValue, 16);

    // Validate the newValue (must be an integer between 0 and 255)
    if (!Number.isInteger(newValue) || newValue < 0 || newValue > 255) {
      throw new Error("Invalid byte value. Must be a valid hexadecimal string representing a value between 0x00 and 0xFF.");
    }

    // Convert the editableData Blob to an ArrayBuffer
    const arrayBuffer = await this.#blobToArrayBuffer(file.editableData);

    // Validate the byteAddress
    if (address < 0 || address >= arrayBuffer.byteLength) {
      throw new Error("Byte address out of bounds.");
    }

    // Create a DataView to modify the ArrayBuffer
    const dataView = new DataView(arrayBuffer);
    dataView.setUint8(address, newValue); // Set the new byte value

    // Update the editableData with the modified ArrayBuffer
    file.editableData = new Blob([arrayBuffer], { type: file.editableData.type });
  }

  /**
   * Downloads the files. If there's only one file, download it directly.
   * If there are multiple files, create and download a ZIP archive.
   *
   * @return {Promise<void>} A promise that resolves when the download starts.
   */
  async downloadFile() {
    if (this.files.length === 0) {
      console.warn("No files to download.");
      return;
    }

    if (this.files.length === 1) {
      // Download the single file directly
      const file = this.files[0];
      const url = URL.createObjectURL(file.editableData);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Create and download a ZIP file containing all files
      const zip = new JSZip();
      for (const file of this.files) {
        zip.file(file.name, file.editableData);
      }

      try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.downloadFileName + ".zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error generating ZIP file:", error);
        throw new Error("Failed to generate ZIP file.");
      }
    }
  }



  /**
   * ************************************************************************
   * PRIVATE METHODS
   * Do not call these methods directly.
   * Instead, call the corresponding public method.
   * ************************************************************************
   */

  /**
   * Calculates the MD5 for a given Blob.
   * 
   * @param {Blob} blob - The Blob to hash.
   * @returns {Promise<string>} - A promise that resolves to the hexadecimal string representation of the hash.
   * @throws {TypeError} Will throw a TypeError if the input is not a Blob.
   * @throws {Error} Will throw an error if the hashing process fails.
   */
  async #calculateMD5(blob) {
    if (!(blob instanceof Blob)) {
      const errorMessage = "Invalid input: Expected a Blob.";
      console.error(errorMessage);
      throw new TypeError(errorMessage);
    }

    try {
      const arrayBuffer = await this.#blobToArrayBuffer(blob);
      return md5(arrayBuffer); // Using md5.min.js library for MD5 hashing
    } catch (error) {
      const errorMessage = "Error calculating MD5 hash.";
      console.error(errorMessage, error);
      throw new Error(errorMessage); // Wrapping the original error to keep the stack trace
    }
  }

  /**
   * Calculates the SHA-1 hash for a given Blob.
   * 
   * @param {Blob} blob - The Blob to hash.
   * @returns {Promise<string>} - A promise that resolves to the hexadecimal string representation of the hash.
   * @throws {TypeError} Will throw a TypeError if the input is not a Blob.
   * @throws {Error} Will throw an error if the hashing process fails.
   */
  async #calculateSHA1(blob) {
    if (!(blob instanceof Blob)) {
      const errorMessage = "Invalid input: Expected a Blob.";
      console.error(errorMessage);
      throw new TypeError(errorMessage);
    }

    try {
      const arrayBuffer = await this.#blobToArrayBuffer(blob);
      const shaObj = new jsSHA("SHA-1", "ARRAYBUFFER");
      shaObj.update(arrayBuffer);
      return shaObj.getHash("HEX");
    } catch (error) {
      const errorMessage = "Error calculating SHA-1 hash.";
      console.error(errorMessage, error);
      throw new Error(errorMessage); // Wrapping the original error with a more descriptive message
    }
  }

  /**
   * Converts a Blob to an ArrayBuffer.
   * 
   * @param {Blob} blob - The Blob to convert.
   * @returns {Promise<ArrayBuffer>} - A promise that resolves to the ArrayBuffer representation of the Blob.
   */
  #blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Error reading Blob as ArrayBuffer."));
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Validates the file name.
   * 
   * @param {string} fileName - The name of the file.
   * @returns {boolean} - True if the file name is valid, false otherwise.
   */
  #isValidFileName(fileName) {
    // Check if fileName is a non-empty string
    if (typeof fileName !== 'string' || fileName.trim() === '') {
      return false;
    }

    // Reserved Windows names that cannot be used as filenames
    const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

    // Regular expression for invalid characters in file names
    const illegalChars = /[\/\\?%*:|"<>]/;

    // Check for leading dots or spaces
    if (/^[.\s]/.test(fileName)) {
      return false;
    }

    // Check for illegal characters or reserved names
    if (illegalChars.test(fileName) || reservedNames.test(fileName)) {
      return false;
    }

    // Check if the filename ends with a dot or space (Windows restriction)
    if (/[. ]$/.test(fileName)) {
      return false;
    }

    // Check length restrictions (255 characters max for Windows)
    if (fileName.length > 255) {
      return false;
    }

    // If all checks pass, the filename is valid
    return true;
  }

}
