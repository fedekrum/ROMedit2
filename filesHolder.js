// FilesHolder.js
class FilesHolder {
  constructor() {
    this.files = [];
    this.zipFileName = "ROMedit.zip"; // Default ZIP file name
    this.hashAlgorithm = "SHA-1"; // Default hash algorithm
  }

  setHashAlgorithm(algorithm) {
    this.hashAlgorithm = algorithm;
  }

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

  async addFile(file) {
    try {
      // Ignore invisible files (starting with a dot)
      if (file.name.startsWith(".")) {
        console.log(`Skipping invisible file: ${file.name}`);
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const originalHash = await this.calculateHash(arrayBuffer);

      if (file.type === "application/zip") {
        this.zipFileName = file.name; // Update the ZIP file name to the last uploaded ZIP
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
    }
  }

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

          // Automatically select the first valid file
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
    }
  }

  getFiles() {
    return this.files;
  }

  getFile(fileName) {
    return this.files.find((file) => file.name === fileName);
  }

  clearFiles() {
    this.files = [];
  }

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

  getZipFileName() {
    return this.zipFileName;
  }
}
