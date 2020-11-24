// When the page loads, attach methods to store any data that
// changes or retrieve information from the API, then set up
// the default page layout
window.onload = (e) => {
    document.querySelector("#search").onclick = searchButtonClicked;

    populateBreeds("load");
    getStoredLimit();

    document.querySelector("#breed").onchange = e => {
        setLocalStorage();
        populateBreeds("change");
    };

    document.querySelector("#sub-breed").onchange = setLocalStorage;

    document.querySelector("#limit").onchange = setLocalStorage;
};

//Local Storage Information
let prefix = "jdh5563-";
let breedKey = prefix + "breed";
let subBreedKey = prefix + "sub-breed";
let limitKey = prefix + "limit";
let displayTerm = "";
let status = "load";

// When the search button is clicked, determine the sorting method
// for the search, then build a url to use for retrieving the data
function searchButtonClicked() {

    // The default url
    const DOG_URL = "https://dog.ceo/api/breed";

    // Build up our URL string
    let url = DOG_URL;

    // The url is different depending on if the sorting is random
    // or a specific breed/subbreed
    if (document.querySelector("#breed").value == "random") {
        url += "s/image/random";
        displayTerm = "Random";
    }
    else {
        url += "/" + document.querySelector("#breed").value;

        let subbreed = document.querySelector("#sub-breed");

        // Determine if we are looking at a random subbreed within the breed or at a specific subbreed
        if (subbreed.options[subbreed.selectedIndex].text == "All" || document.querySelector("#sub-breed").value == "") {
            url += "/images/random";
            displayTerm = document.querySelector("#breed").value;
        }
        else {
            url += "/" + document.querySelector("#sub-breed").value + "/images/random";
            displayTerm = document.querySelector("#sub-breed").value + " " + document.querySelector("#breed").value;
        }
    }
    // Grab the user chosen search 'limit' from the <select> and append it to the URL
    let limit = document.querySelector("#limit").value;
    url += "/" + limit;

    // Request data!
    getData(url);
}

// Puts in a request for the list of all breeds
// so the 'breed' <select> can be populated or
// so the subbreed <select> can be updated depending
// on what the status is when the function is called
function populateBreeds(status) {
    // 1 - create a new XHR object
    let xhr = new XMLHttpRequest();

    // 2 - set the onload handler
    if (status == "load") {
        xhr.onload = breedDataLoaded;
    }
    else {
        xhr.onload = breedDataChanged;
    }

    // 3 - set the onerror handler
    xhr.onerror = dataError;

    // 4 - open connection and send the request
    xhr.open("GET", "https://dog.ceo/api/breeds/list/all");
    xhr.send();
}

// Populates the 'breed' <select>
function breedDataLoaded(e) {

    let xhr = e.target;

    // 7 - turn the text into a parsable JavaScript object
    let obj = JSON.parse(xhr.responseText);

    // 8 - if there are no results, print a message and return
    if (obj.status != "success") {
        document.querySelector("#status").innerHTML = "<b>No results found for '" + displayTerm + "'</b>";
        return; // Bail out
    }

    // 9 - start building an HTML string we will display to the user
    let results = obj.message;

    // 10 - loop through the array of results
    for (let result in results) {
        let option = document.createElement("option");
        option.value = result;
        option.innerHTML = result;
        document.querySelector("#breed").append(option);
    }

    getStoredBreed();
}

// Updates the 'sub-breed' <select> to match the
// corresponding breed
function breedDataChanged(e) {
    let xhr = e.target;

    // 7 - turn the text into a parsable JavaScript object
    let obj = JSON.parse(xhr.responseText);

    // 8 - if there are no results, print a message and return
    if (obj.status != "success") {
        document.querySelector("#status").innerHTML = "<b>No results found for '" + displayTerm + "'</b>";
        return; // Bail out
    }

    // 9 - start building an HTML string we will display to the user
    let breeds = obj.message;

    let breed = document.querySelector("#breed").value;

    // If the breed isn't random and there are subbreeds,
    // populate the 'sub-breed' <select>
    if (breed != "random" && breeds[breed].length > 0) {
        if (document.querySelector("#sub-breed").childElementCount == 0) {
            for (let subbreed of breeds[breed]) {
                let option = document.createElement("option");
                option.value = subbreed;
                option.innerHTML = subbreed;
                document.querySelector("#sub-breed").append(option);
            }
        }
        else {
            let list = document.querySelector("#sub-breed");
            for (let child = 0; child < list.length; child++) {
                list.removeChild(list[child]);
                child--;
            }

            for (let subbreed of breeds[breed]) {
                let option = document.createElement("option");
                option.value = subbreed;
                option.innerHTML = subbreed;
                document.querySelector("#sub-breed").append(option);
            }
        }

        if (document.querySelector("#sub-breed").childElementCount == 1) {
            document.querySelector("#sub-breed").style.display = "none";
            document.querySelector("#at-most-one").style.display = "inline";
            document.querySelector("#at-most-one").innerHTML = document.querySelector("#sub-breed").value;
        }
        else {
            let defaultOption = document.createElement("option");
            defaultOption.value = "all";
            defaultOption.innerHTML = "All";
            document.querySelector("#sub-breed").prepend(defaultOption);
            document.querySelector("#sub-breed").style.display = "inline";
            document.querySelector("#at-most-one").style.display = "none";
        }
    }
    // If the breed is random or there are no
    // subbreeds, populate the 'sub-breed' <select>
    // with "No Sub-Breeds"
    else {
        let list = document.querySelector("#sub-breed");
        for (let child = 0; child < list.length; child++) {
            list.removeChild(list[child]);
            child--;
        }

        let defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.innerHTML = "No Sub-Breeds";
        document.querySelector("#sub-breed").prepend(defaultOption);

        document.querySelector("#sub-breed").style.display = "none";
        document.querySelector("#at-most-one").style.display = "inline";
        document.querySelector("#at-most-one").innerHTML = "No Sub-Breeds";
    }

    document.querySelector("#sub-breed").selectedIndex = 0;

    // Load up the stored sub-breed on page load
    if (status == "loadSubBreed") {
        getStoredSubBreed();
    }

    // Save the changed sub breed
    setLocalStorage();
}

// Sends a request for data from a specified url
function getData(url) {
    // 1 - create a new XHR object
    let xhr = new XMLHttpRequest();

    // 2 - set the onload handler
    xhr.onload = dataLoaded;

    // 3 - set the onerror handler
    xhr.onerror = dataError;

    // 4 - open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

// Callback functions

// Loads a set of images and adds them to
// a grid to be displayed on the screen
function dataLoaded(e) {
    // 5 - event.target is the xhr object
    let xhr = e.target;

    // 7 - turn the text into a parsable JavaScript object
    let obj = JSON.parse(xhr.responseText);

    // 8 - if there are no results, print a message and return
    if (obj.status != "success") {
        document.querySelector("#status").innerHTML = "<b>No results found for '" + displayTerm + "'</b>";
        return; // Bail out
    }

    // 9 - start building an HTML string we will display to the user
    let results = obj.message;
    let bigString = "";

    // 10 - loop through the array of results
    for (let i = 0; i < results.length; i++) {
        let result = results[i];

        // 11 - get the URL to the dog
        let smallurl = result;
        if (!smallurl) {
            smallurl = "images/no-image-found.png";
        }

        // 13 - build a <div> to hold each result
        // ES6 String Templating

        // Holds the breed and subbreed with the first character capitalized
        let subbreed = document.querySelector("#sub-breed").value.substring(0, 1).toUpperCase() + document.querySelector("#sub-breed").value.substring(1);
        let breed = document.querySelector("#breed").value.substring(0, 1).toUpperCase() + document.querySelector("#breed").value.substring(1);

        // If the breed isn't random and there is a subbreed,
        // assign the results subbreed to the subbreed variable
        if (breed != "Random") {
            if (subbreed != "") {
                subbreed = result.substring(31 + breed.length, 32 + breed.length).toUpperCase() + result.substring(32 + breed.length, result.lastIndexOf('/'));
            }
        }

        // Create the image
        let line = `<div class='result'><img src='${smallurl}' title='${breed}' class='dog-image'/>`;
        line += `<span><a href='${smallurl}' target='_blank'><button type='button' class='enlarge'>View Enlarged</button></a>`;

        // If the breed is random, determine the breed and subbreed (if it exists), then add it to the line
        if (breed == "Random") {
            let fullBreed = result.substring(30, result.lastIndexOf('/'));
            if (fullBreed.includes('-')) {
                breed = result.substring(30, 31).toUpperCase() + result.substring(31, result.indexOf('-'));
                subbreed = result.substring(31 + breed.length, 32 + breed.length).toUpperCase() + result.substring(32 + breed.length, result.lastIndexOf('/'));

                line += `<p class='desc'>${subbreed + " " + breed}</p></span></div>`;
            }
            else {
                breed = result.substring(30, 31).toUpperCase() + result.substring(31, result.lastIndexOf('/'));
                line += `<p class='desc'>${breed}</p></span></div>`;
            }
        }

        // If the breed is not random, assign the current breed and subbreed (if it exists), then add it to the line
        else {
            if (document.querySelector("#sub-breed").value == "all") {
                line += `<p class='desc'>${subbreed + " " + breed}</p></span></div>`;
            }
            else {
                line += `</span></div>`;
            }
        }

        // 15 - add the <div> to 'bigString' and loop
        bigString += line;
    }

    // 16 - all done building the HTML - show it to the user!
    document.querySelector("#content").innerHTML = bigString;

    let displayEndResult = "";
    // 17 - update the status
    if(results.length < document.querySelector("#limit").value){
        displayEndResult += "Oops! There are only " + results.length + " images for " + displayTerm + ". ";
    }

    displayEndResult += "Here are " + results.length + " results for '" + displayTerm + "'.";

    document.querySelector("#status").innerHTML = "<b>Success!</b><p><i>" + displayEndResult + "</i></p>";
}

// Ping the console if there is an error
function dataError(e) {
    console.log("An error occurred.");
}

// Assigns a value to the 'breed' <select>
function getStoredBreed() {
    const storedBreed = localStorage.getItem(breedKey);

    if (storedBreed) {
        document.querySelector("#breed").value = storedBreed;
        status = "loadSubBreed";
        populateBreeds(status);
    }
    else {
        document.querySelector("#breed").value = "random";
        document.querySelector("#sub-breed").style.display = "none";
        document.querySelector("#at-most-one").style.display = "inline";
    }
}

// Assigns a value to the 'limit' <select>
function getStoredLimit() {
    const storedLimit = localStorage.getItem(limitKey);

    if (storedLimit) {
        document.querySelector("#limit").value = storedLimit;
    }
    else {
        document.querySelector("#limit").value = "10";
    }
}

// Assigns a value to the 'sub-breed' <select>
function getStoredSubBreed() {
    const storedSubBreed = localStorage.getItem(subBreedKey);

    if (storedSubBreed) {
        document.querySelector("#sub-breed").value = storedSubBreed;
    }
    else {
        document.querySelector("#sub-breed").value = "";
    }

    status = "change";

    searchButtonClicked();
}

// Stores breed, subbreed, and limit values to be used when the page is reopened
function setLocalStorage() {
    let breedValue = document.querySelector("#breed").value;
    localStorage.setItem(breedKey, breedValue);

    let subBreedValue = document.querySelector("#sub-breed").value;
    localStorage.setItem(subBreedKey, subBreedValue);

    let limitValue = document.querySelector("#limit").value;
    localStorage.setItem(limitKey, limitValue);
}