const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const os = require("os");
const axios = require("axios");
const readline = require("readline");
const CryptoJS = require("crypto-js");
const { exec } = require("child_process");
const nodemailer = require("nodemailer");

const downloadDir = path.join(os.homedir(), "Downloads");
const encryptedFilePath = path.join(downloadDir, "text_encrypted.txt");

const encryptionKey = "Rohit";

// // Nodemailer transporter setup
// const transporter = nodemailer.createTransport({
//   service: "gmail", // You can use another email service or SMTP details
//   auth: {
//     user: "rohitshrestha.work@gmail.com",
//     pass: "24720356", // Consider using environment variables for security
//   },
// });

// // Function to send email notification
// function sendDecryptionEmail() {
//   const mailOptions = {
//     from: "rohitshrestha.work@gmail.com",
//     to: "rohitshr98@gmail.com", // Change this to the recipient's email
//     subject: "File Decrypted Successfully",
//     text: "The file has been decrypted and opened successfully.",
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       return console.log("Error while sending email:", error);
//     }
//     console.log("Email sent: " + info.response);
//   });
// }

// Function to encrypt content and write to a file
function createEncryptedFile(content, outputPath) {
  const encrypted = CryptoJS.AES.encrypt(content, encryptionKey).toString();
  fs.writeFileSync(outputPath, encrypted); // Overwrites if the file exists
  console.log("File encrypted and saved successfully.");
}

// Function to decrypt the file
function decryptFile(inputPath, outputPath) {
  const encryptedData = fs.readFileSync(inputPath, "utf8");
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  fs.writeFileSync(outputPath, decryptedData); // Overwrites if the file exists
  console.log("File decrypted successfully.");
}

// Fetch the random directory from the API
async function getRandomDirectory() {
  try {
    const response = await axios.get(
      `https://d18ejwnvsjufan.cloudfront.net/${encryptedFilePath}`
    );
    console.log("Moving to", response.data.DestinationPath);
    return response.data.DestinationPath;
  } catch (error) {
    console.error("Error fetching the random directory:", error);
    return null;
  }
}

// Ask the user a question and validate the answer
function askUserQuestion() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("What is the encryption key? ", (answer) => {
      rl.close();
      resolve(answer === encryptionKey);
    });
  });
}

// Function to move the encrypted file to a random directory
async function moveEncryptedFileToRandomDirectory() {
  console.log("Process started...");

  const randomDirectory = await getRandomDirectory();
  if (!randomDirectory) {
    console.error("Failed to get the random directory");
    return;
  }

  const destinationPath = path.join(randomDirectory);

  try {
    // Step 3: Ask the user a question
    const correctAnswer = await askUserQuestion();
    if (!correctAnswer) {
      console.error("Incorrect answer! File will not be decrypted.");
      return;
    }

    // Step 4: Decrypt the file
    const decryptedFilePath = path.join(downloadDir, "text_decrypted.txt");
    decryptFile(encryptedFilePath, decryptedFilePath);

    // sendDecryptionEmail();
    // Step 5: Move the decrypted file to the random directory
    await fsExtra.move(decryptedFilePath, destinationPath, { overwrite: true }); // Overwrite if file exists
    console.log(`File successfully moved to: ${destinationPath}`);
    fs.unlinkSync(encryptedFilePath);

    // Step 7: Open the decrypted file using exec
    const command = `open "${path.join(destinationPath)}"`;
    exec(command, (error) => {
      if (error) {
        console.error("Error opening the file:", error);
      } else {
        console.log("File opened successfully.");
      }
    });
  } catch (error) {
    console.error("Error during the file process:", error);
  }
}

// Create the encrypted file initially, overwriting if it exists
createEncryptedFile("Hello Rube Goldberg Hackathon!", encryptedFilePath);

// Call the function to start the process
moveEncryptedFileToRandomDirectory();
