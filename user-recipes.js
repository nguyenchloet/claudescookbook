// insert Claude's recipe into Claude's Cookbook
const USER_RECIPES_KEY = "claudesCookbookUserRecipes";

const recipeForm = document.getElementById("new-recipe-form");
const showRecipeFormButton = document.getElementById("show-recipe-form");
const recipeFormError = document.getElementById("recipe-form-error");
const recipeContainer = document.getElementById("recipe-container");

function getUserRecipes() {
    return JSON.parse(localStorage.getItem(USER_RECIPES_KEY) || "[]");
}

function saveUserRecipes(recipes) {
    localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(recipes));
}

function createTextElement(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
}

function displayUserRecipe(recipe) {
    const article = document.createElement("article");
    article.className = "user-recipe-card";
    article.id = `user-recipe-${recipe.id}`;

    article.appendChild(createTextElement("h2", recipe.name));
    article.appendChild(createTextElement("p", `Yield: ${recipe.yield}`));

    if (recipe.image) {
        const image = document.createElement("img");
        image.src = recipe.image;
        image.alt = recipe.name;
        article.appendChild(image);
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "user-recipe-image-placeholder";
        placeholder.setAttribute("aria-label", "No recipe image provided");
        article.appendChild(placeholder);
    }

    article.appendChild(createTextElement("h3", "Ingredients"));

    const ingredientsList = document.createElement("ul");

    recipe.ingredients.forEach(ingredient => {
        ingredientsList.appendChild(createTextElement("li", ingredient));
    });

    article.appendChild(ingredientsList);

    article.appendChild(createTextElement("h3", "Directions"));

    const directionsList = document.createElement("ol");

    recipe.directions.forEach(direction => {
        directionsList.appendChild(createTextElement("li", direction));
    });

    article.appendChild(directionsList);
    article.appendChild(createTextElement("p", `Source: ${recipe.source}`));

    recipeContainer.appendChild(article);

    if (window.location.hash === `#${article.id}`) {
        article.scrollIntoView();
    }
}

function displaySavedUserRecipes() {
    const recipes = getUserRecipes();

    recipes.forEach(recipe => {
        displayUserRecipe(recipe);
    });
}

showRecipeFormButton.addEventListener("click", () => {
    recipeForm.hidden = !recipeForm.hidden;
    showRecipeFormButton.textContent = recipeForm.hidden
        ? "Add a Recipe"
        : "Cancel";
});

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("Could not read the selected image."));
            }
        });
        reader.addEventListener("error", () => {
            reject(reader.error || new Error("Could not read the selected image."));
        });
        reader.readAsDataURL(file);
    });
}

recipeForm.addEventListener("submit", async event => {
    event.preventDefault();

    recipeFormError.textContent = "";

    if (!recipeForm.checkValidity()) {
        recipeFormError.textContent = "Please complete all required fields.";
        recipeForm.reportValidity();
        return;
    }

    const imageFile = document.getElementById("new-recipe-image").files[0];
    let image = "";

    if (imageFile) {
        try {
            image = await readImageFile(imageFile);
        } catch (error) {
            recipeFormError.textContent = error.message;
            return;
        }
    }

    const recipe = {
        id: crypto.randomUUID(),
        name: document.getElementById("new-recipe-name").value.trim(),
        yield: document.getElementById("new-recipe-yield").value.trim(),
        ingredients: document.getElementById("new-recipe-ingredients").value
            .split("\n")
            .map(item => item.trim())
            .filter(item => item),
        directions: document.getElementById("new-recipe-directions").value
            .split("\n")
            .map(item => item.trim())
            .filter(item => item),
        source: document.getElementById("new-recipe-source").value.trim(),
        image
    };

    if (
        recipe.ingredients.length === 0 ||
        recipe.directions.length === 0
    ) {
        recipeFormError.textContent =
            "Please enter at least one ingredient and one direction.";
        return;
    }

    const recipes = getUserRecipes();
    recipes.push(recipe);
    saveUserRecipes(recipes);

    displayUserRecipe(recipe);

    recipeForm.reset();
    recipeForm.hidden = true;
    showRecipeFormButton.textContent = "Add a Recipe";
});

displaySavedUserRecipes();

const RECIPE_IMAGES_KEY = "claudesCookbookRecipeImages";

function getRecipeImages() {
    return JSON.parse(localStorage.getItem(RECIPE_IMAGES_KEY) || "{}");
}

function saveRecipeImage(recipeItem, imageData) {
    const recipeImages = getRecipeImages();
    const recipeName = recipeItem.querySelector("h2").textContent.trim();

    recipeImages[recipeName] = imageData;

    localStorage.setItem(
        RECIPE_IMAGES_KEY,
        JSON.stringify(recipeImages)
    );
}

function loadRecipeImages() {
    const recipeImages = getRecipeImages();

    document.querySelectorAll(".recipe-item").forEach(recipeItem => {
        const recipeName = recipeItem.querySelector("h2")?.textContent.trim();
        const image = recipeItem.querySelector(".recipe-image");

        if (recipeName && image && recipeImages[recipeName]) {
            image.src = recipeImages[recipeName];
            image.hidden = false;
        }
    });
}

document.querySelectorAll(".recipe-image-input").forEach(input => {
    input.addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const recipeItem = input.closest(".recipe-item");
            const image = recipeItem.querySelector(".recipe-image");
            const removeButton = recipeItem.querySelector(".remove-recipe-image");
removeButton.hidden = false;

            image.src = reader.result;
            image.hidden = false;
            removeButton.hidden = false;

            saveRecipeImage(recipeItem, reader.result);
        };

        reader.readAsDataURL(file);
    });
});

loadRecipeImages();

document.querySelectorAll(".remove-recipe-image").forEach(button => {
    button.addEventListener("click", () => {
        const recipeItem = button.closest(".recipe-item");
        const recipeName = recipeItem.querySelector("h2").textContent.trim();
        const recipeImages = getRecipeImages();

        delete recipeImages[recipeName];

        localStorage.setItem(
            RECIPE_IMAGES_KEY,
            JSON.stringify(recipeImages)
        );

        const image = recipeItem.querySelector(".recipe-image");
        image.src = "";
        image.hidden = true;
        button.hidden = true;
    });
});