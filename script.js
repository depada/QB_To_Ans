document.addEventListener("DOMContentLoaded", function () {
  const pdfInput = document.getElementById("pdfInput");
  const extractBtn = document.getElementById("extractBtn");
  const generateBtn = document.getElementById("generateBtn");
  let selectedPdf = null;
  let extractedQuestions = [];

  const filterQuestions = (textItems) => {
    const questions = [];
    let isQuestion = false;
    let currentQuestion = [];

    // Iterate through the text items
    for (const item of textItems) {
      // Check if the item is a number
      if (/^\d+$/.test(item)) {
        // If it's a number, it may be a question number
        if (isQuestion) {
          // If we were previously inside a question, this is the end of that question
          questions.push(currentQuestion.join(" "));
          currentQuestion = []; // Reset the current question
        }
        isQuestion = true; // Mark the start of a new question
      } else {
        // If it's not a number, it's part of the question content
        currentQuestion.push(item);
      }
    }

    // If we are still inside a question at the end, add it to the questions array
    if (isQuestion) {
      questions.push(currentQuestion.join(" "));
    }

    return questions;
  };

  const extractQuestionsFromPDF = async (pdfFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Create a new Blob from the provided pdfFile
        const blob = new Blob([pdfFile]);
        const arrayBuffer = await blob.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);

        // Load the PDF document using pdfjsLib.getDocument
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });

        loadingTask.promise
          .then(async function (pdfDocument) {
            // Initialize an array to store extracted questions
            const extractedQuestions = [];

            // Loop through each page in the PDF document
            for (
              let pageNumber = 1;
              pageNumber <= pdfDocument.numPages;
              pageNumber++
            ) {
              const page = await pdfDocument.getPage(pageNumber);

              const textContent = await page.getTextContent();

              const textItems = textContent.items.map((item) => item.str);
              const questionsFiltered = filterQuestions(textItems);
              extractedQuestions.push(...questionsFiltered);
            }

            // Now, you have an array of questions starting with specific words
            const flattenedArr = extractedQuestions.flat();
            resolve(flattenedArr);
          })
          .catch(function (error) {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  };

  pdfInput.addEventListener("change", () => {
    selectedPdf = pdfInput.files[0];
  });

  extractBtn.addEventListener("click", async () => {
    try {
      // Get the selected PDF file

      if (!selectedPdf) {
        alert("Please select a PDF file.");
        return;
      }

      // Call the extractQuestionsFromPDF function
      extractedQuestions = await extractQuestionsFromPDF(selectedPdf);

      // Handle the extracted questions (you can display or process them here)
      console.log(extractedQuestions);
      alert("Text extraction complete.");
    } catch (error) {
      console.error(error);
      alert("An error occurred while extracting text from the PDF.");
    }
  });

  generateBtn.addEventListener("click", () => {
    // Send a message to the content script to request the textarea content
    chrome.tabs.query({ active: true }, (tabs) => {
      debugger;
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        // Execute the content script
        debugger;
        chrome.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            function: () => {
              debugger;
              // Find the textarea element and get its content
              const textArea = document.querySelector("textarea");
              if (textArea) {
                console.log("Textarea Element:", textArea.outerHTML);
              } else {
                console.log("Textarea element not found on the current page.");
              }
            },
          },
          () => {
            console.log("Content script executed.");
          }
        );
      } else {
        alert("No active tab found.");
      }
    });
  });

  //   chrome.scripting
  //     .executeScript({
  //       target: { tabId: getTabId() },
  //       files: ["script.js"],
  //     })
  //     .then(() => console.log("injected script file"));
});
