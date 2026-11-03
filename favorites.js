const RECIPE_IMPORTER_URL =
    "https://claudes-recipe-importer.nguyenchloet.workers.dev";

const FAVORITES_STORAGE_KEY = "claudesCookbookFavorites";

const favoriteForm = document.getElementById("favorite-form");
const favoriteFormSection = document.querySelector(".favorite-form-section");
const toggleFavoriteForm = document.getElementById("toggle-favorite-form");
const importButton = document.getElementById("import-recipe-button");
const importStatus = document.getElementById("import-status");
const favoritesContainer = document.getElementById("favorites-container");

const recipeUrl = document.getElementById("recipe-url");
const recipeTitle = document.getElementById("recipe-title");
const recipeYield = document.getElementById("recipe-yield");
const recipeIngredients = document.getElementById("recipe-ingredients");
const recipeDirections = document.getElementById("recipe-directions");
const recipeNotes = document.getElementById("recipe-notes");

function getFavorites() {
    try {
        return JSON.parse(
            localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]"
        );
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favorites)
    );
}

function formatYield(value) {
    return Array.isArray(value) ? value.join(" or ") : value || "";
}

function formatRecipeText(value) {
    return Array.isArray(value) ? value.join("\n") : value || "";
}

function parseYield(value) {
    const text = String(value).toLowerCase().trim();

    const numberWords = {
        zero: 0,
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
        eleven: 11,
        twelve: 12,
        half: 0.5,
        "one half": 1.5
    };

    const match = text.match(
        /\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half/
    );

    if (!match) return null;

    const valueFound = match[0];

    return numberWords[valueFound] !== undefined
        ? numberWords[valueFound]
        : Number(valueFound);
}

async function importRecipe() {
    const url = recipeUrl.value.trim();

    if (!url) {
        importStatus.textContent = "Enter a recipe URL first.";
        return;
    }

    importButton.disabled = true;
    importStatus.textContent = "Importing recipe...";

    try {
        const response = await fetch(RECIPE_IMPORTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const recipe = await response.json();

        if (!response.ok) {
            throw new Error(recipe.error || "Recipe import failed.");
        }

        recipeTitle.value = recipe.title || "";
        recipeYield.value = formatYield(recipe.yield);
        recipeIngredients.value = formatRecipeText(recipe.ingredients);
        recipeDirections.value = formatRecipeText(recipe.directions);

        importStatus.textContent =
            "Recipe imported. Review the details and save when ready.";

            favoriteForm.dataset.image = recipe.image || "";

    } catch (error) {
        importStatus.textContent = error.message;
    } finally {
        importButton.disabled = false;
    }
}

function parseIngredientAmount(value) {
    value = value.trim();

    const unicodeFractions = {
        "½": 0.5,
        "⅓": 1 / 3,
        "⅔": 2 / 3,
        "¼": 0.25,
        "¾": 0.75,
        "⅛": 0.125,
        "⅜": 0.375,
        "⅝": 0.625,
        "⅞": 0.875
    };

    if (unicodeFractions[value] !== undefined) {
        return unicodeFractions[value];
    }

    const mixedMatch = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        return Number(mixedMatch[1]) +
            Number(mixedMatch[2]) / Number(mixedMatch[3]);
    }

    const fractionMatch = value.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        return Number(fractionMatch[1]) / Number(fractionMatch[2]);
    }

    return Number(value);
}

function formatIngredientAmount(value) {
    if (!Number.isFinite(value)) return value;

    const fractions = [
        { value: 0, text: "" },
        { value: 1 / 8, text: "⅛" },
        { value: 1 / 4, text: "¼" },
        { value: 1 / 3, text: "⅓" },
        { value: 3 / 8, text: "⅜" },
        { value: 1 / 2, text: "½" },
        { value: 5 / 8, text: "⅝" },
        { value: 2 / 3, text: "⅔" },
        { value: 3 / 4, text: "¾" },
        { value: 7 / 8, text: "⅞" }
    ];

    const whole = Math.floor(value);
    const decimal = value - whole;

    const closest = fractions.reduce((best, fraction) =>
        Math.abs(fraction.value - decimal) <
        Math.abs(best.value - decimal) ? fraction : best
    );

    if (Math.abs(closest.value - decimal) < 0.015) {
        return `${whole ? whole : ""}${whole && closest.text ? " " : ""}${closest.text}` || "0";
    }

    return Number(value.toFixed(3)).toString();
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}
function createRecipeList(items, recipe, originalYield) {
    const list = document.createElement("ul");

    items.forEach(item => {
        const listItem = createElement("li", "favorite-ingredient");

        const match = item.match(/^(\d+(?:\s+\d+\/\d+|\s*\/\s*\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞])\s*(.*)$/);

        if (match) {
            const amount = createElement("span", "ingredient-amount", match[1]);
            const output = createElement("span", "output-amount", match[1]);
            const remainder = document.createTextNode(match[2] ? ` ${match[2]}` : "");

            listItem.append(amount, output, remainder);
        } else {
            listItem.textContent = item;
        }

        list.appendChild(listItem);
    });

    return list;
}

function updateRecipeIngredients(article) {
    const originalYield = Number(article.dataset.originalYield);
    const currentYield = Number(article.dataset.currentYield);

    if (!originalYield || !currentYield) return;

    article.querySelectorAll(".favorite-ingredient").forEach(item => {
        const amountElement = item.querySelector(".ingredient-amount");
        const outputElement = item.querySelector(".output-amount");

        if (!amountElement || !outputElement) return;

        const originalText = amountElement.textContent.trim();
        const match = originalText.match(/^(\d+(?:\s+\d+\/\d+|\s*\/\s*\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞])$/);

        if (!match) return;

        const amount = parseIngredientAmount(originalText);

        if (!Number.isFinite(amount)) return;

        outputElement.textContent = formatIngredientAmount(
            amount * currentYield / originalYield
        );
    });
}

function updateRecipeYield(article, change) {
    const originalYield = Number(article.dataset.originalYield);
    const currentYield = Number(article.dataset.currentYield);
    const increment = Number(article.dataset.increment);

    if (!originalYield || !Number.isFinite(currentYield)) return;

    const newYield = Math.max(1, currentYield + change * increment);

    article.dataset.currentYield = newYield;

    article.querySelector(".yield-output").textContent = newYield;
    updateRecipeIngredients(article);
}

function renderFavorites() {
    const favorites = getFavorites();
    favoritesContainer.replaceChildren();

    if (favorites.length === 0) {
        favoritesContainer.appendChild(
            createElement("p", "", "You haven't saved any favorite recipes yet.")
        );
        return;
    }

    favorites.forEach(recipe => {
        const article = createElement("article", "favorite-recipe");
        article.id = `favorite-${recipe.id}`;
        
        const title = createElement("h2", "", recipe.title);
        article.appendChild(title);

        if (recipe.image) {
            const image = createElement("img");
            image.src = recipe.image;
            image.alt = recipe.title;
            image.loading = "lazy";
            article.appendChild(image);
        }

        if (!recipe.image) {
            const imageInput = createElement("input");
            imageInput.type = "url";
            imageInput.placeholder = "Paste image URL";
            imageInput.setAttribute("aria-label", `Image URL for ${recipe.title}`);

            const addImageButton = createElement("button", "", "Add Image");
            addImageButton.type = "button";

            addImageButton.addEventListener("click", () => {
                const imageUrl = imageInput.value.trim();

                if (!imageUrl) return;

                const favorites = getFavorites();
                const savedRecipe = favorites.find(item => item.id === recipe.id);

                if (!savedRecipe) return;

                savedRecipe.image = imageUrl;
                saveFavorites(favorites);
                renderFavorites();
            });

            article.append(imageInput, addImageButton);
        }

        const originalYield = Number(recipe.yieldCount ?? parseYield(recipe.yield));
        const hasNumericYield = Number.isFinite(originalYield) && originalYield > 0;

        if (hasNumericYield) {
            article.dataset.originalYield = originalYield;
            article.dataset.currentYield = originalYield;
            article.dataset.increment = "1";

            const yieldControls = createElement("div", "favorite-yield-controls");

            yieldControls.append(
                createElement("span", "", "Yield: "),
                createElement("span", "yield-output", originalYield)
            );

            const decreaseYield = createElement("button", "", "−");
            decreaseYield.type = "button";
            decreaseYield.addEventListener("click", () =>
                updateRecipeYield(article, -1)
            );

            const increaseYield = createElement("button", "", "+");
            increaseYield.type = "button";
            increaseYield.addEventListener("click", () =>
                updateRecipeYield(article, 1)
            );

            yieldControls.append(decreaseYield, increaseYield);

            const incrementControls = createElement("div", "favorite-increment-controls");

            incrementControls.append(
                createElement("span", "", "Yield adjustment: "),
                createElement("span", "increment-output", "1")
            );

            const decreaseIncrement = createElement("button", "", "−");
            decreaseIncrement.type = "button";
            decreaseIncrement.addEventListener("click", () => {
                const current = Number(article.dataset.increment);
                article.dataset.increment = Math.max(0.25, current - 0.25);
                incrementControls.querySelector(".increment-output").textContent =
                    article.dataset.increment;
            });

            const increaseIncrement = createElement("button", "", "+");
            increaseIncrement.type = "button";
            increaseIncrement.addEventListener("click", () => {
                const current = Number(article.dataset.increment);
                article.dataset.increment = current + 0.25;
                incrementControls.querySelector(".increment-output").textContent =
                    article.dataset.increment;
            });

            incrementControls.append(decreaseIncrement, increaseIncrement);

            const resetButton = createElement("button", "", "Reset Yield");
            resetButton.type = "button";
            resetButton.addEventListener("click", () => {
                article.dataset.currentYield = originalYield;
                article.dataset.increment = "1";
                article.querySelector(".yield-output").textContent = originalYield;
                incrementControls.querySelector(".increment-output").textContent = "1";
                updateRecipeIngredients(article);
            });

            article.append(yieldControls, incrementControls, resetButton);
        } else if (recipe.yield) {
            article.appendChild(
                createElement("p", "", `Yield: ${recipe.yield}`)
            );
        }

        if (recipe.ingredients.length) {
            article.appendChild(createElement("h3", "", "Ingredients"));
            article.appendChild(
                createRecipeList(recipe.ingredients, recipe, originalYield)
            );
            updateRecipeIngredients(article);
        }

        if (recipe.directions.length) {
            article.appendChild(createElement("h3", "", "Directions"));

            const directionsList = document.createElement("ol");

            recipe.directions.forEach(step => {
                directionsList.appendChild(createElement("li", "", step));
            });

            article.appendChild(directionsList);
        }

        if (recipe.notes) {
            article.appendChild(createElement("h3", "", "My Notes"));
            article.appendChild(createElement("p", "", recipe.notes));
        }

        const sourceLink = createElement("a", "", "View original recipe");
        sourceLink.href = recipe.url;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        article.appendChild(sourceLink);

        const deleteButton = createElement("button", "", "Remove Favorite");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => {
            saveFavorites(getFavorites().filter(item => item.id !== recipe.id));
            renderFavorites();
        });

        article.appendChild(deleteButton);
        favoritesContainer.appendChild(article);
    });
}

toggleFavoriteForm.addEventListener("click", () => {
    favoriteFormSection.hidden = !favoriteFormSection.hidden;

    toggleFavoriteForm.textContent = favoriteFormSection.hidden
        ? "Add a Favorite Recipe"
        : "Close Recipe Form";
});

importButton.addEventListener("click", importRecipe);

favoriteForm.addEventListener("submit", event => {
    event.preventDefault();

    const favorites = getFavorites();
    const yieldText = recipeYield.value.trim();

    const recipe = {
        id: crypto.randomUUID(),
        title: recipeTitle.value.trim(),
        url: recipeUrl.value.trim(),
        image: favoriteForm.dataset.image || "",
        yield: yieldText,
        yieldCount: parseYield(yieldText),
        ingredients: recipeIngredients.value.split("\n").map(item => item.trim()).filter(Boolean),
        directions: recipeDirections.value.split("\n").map(item => item.trim()).filter(Boolean),
        notes: recipeNotes.value.trim()
    };

    if (!recipe.title || !recipe.url) return;

    favorites.push(recipe);
    saveFavorites(favorites);

    favoriteForm.reset();
    delete favoriteForm.dataset.image;

    importStatus.textContent = "";
    favoriteFormSection.hidden = true;
    toggleFavoriteForm.textContent = "Add a Favorite Recipe";

    renderFavorites();
});

renderFavorites();

// Cooking Mode: keep the screen awake while cooking
let cookingModeEnabled = false;
let screenWakeLock = null;

const cookingModeToggle = document.getElementById("cooking-mode-toggle");

async function requestScreenWakeLock() {
    if (!cookingModeEnabled || !("wakeLock" in navigator)) {
        return;
    }

    try {
        screenWakeLock = await navigator.wakeLock.request("screen");

        screenWakeLock.addEventListener("release", () => {
            screenWakeLock = null;
        });

    } catch (error) {
        console.error("Could not activate screen wake lock:", error);
        cookingModeEnabled = false;
        cookingModeToggle.setAttribute("aria-checked", "false");
    }
}

cookingModeToggle.addEventListener("click", async () => {
    if (cookingModeEnabled) {
        cookingModeEnabled = false;

        if (screenWakeLock) {
            await screenWakeLock.release();
            screenWakeLock = null;
        }

        cookingModeToggle.setAttribute("aria-checked", "false");

    } else {
        if (!("wakeLock" in navigator)) {
            return;
        }

        cookingModeEnabled = true;
        cookingModeToggle.setAttribute("aria-checked", "true");

        await requestScreenWakeLock();
    }
});

document.addEventListener("visibilitychange", () => {
    if (
        document.visibilityState === "visible" &&
        cookingModeEnabled &&
        !screenWakeLock
    ) {
        requestScreenWakeLock();
    }
});