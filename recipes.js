// variable for original yield values
//const ogYield = parseInt(document.getElementById('og-yield').value, 10);
const ogYields = document.getElementsByClassName('og-yield');
var currentYields = document.getElementsByClassName('yield-output');
const ogIncrement = document.getElementsByClassName('og-increment');
var currentIncrements = document.getElementsByClassName('increment-output');


// get ingredient value (hidden) 
var ingredientAmountList = document.getElementsByClassName('ingredient-amount');

// get output ingredient span
var outputAmountList = document.getElementsByClassName('output-amount');
var index = 0;

document.querySelectorAll('.ingredient').forEach(function(ingredient) {
  var checkbox = ingredient.querySelector('input[type="checkbox"]');
  var label = ingredient.cloneNode(true);

  label.querySelectorAll('input, .output-amount').forEach(function(element) {
    element.remove();
  });
  label.querySelectorAll('.ingredient-amount').forEach(function(element) {
    element.textContent += ' ';
  });
  checkbox.setAttribute('aria-label', label.textContent.replace(/\s+/g, ' ').trim());
});

// get initial increment
var currentIncrement = ogIncrement[index].innerHTML;


// get ingredient values on page load
window.onload = function() {
  // set current yield on load
  for (var i = 0; i < currentYields.length; i++ ) {
    currentYields[i].innerHTML = ogYields[i].innerHTML;
  }

  for (var i = 0; i < outputAmountList.length; i++) {
    outputAmountList[i].innerHTML = ingredientAmountList[i].innerHTML;
  }

  for (var i = 0; i < currentIncrements.length; i++) {
    currentIncrements[i].innerHTML = ogIncrement[i].innerHTML;
  }
}

// allow scroll through recipes
var prev = $('.prev');
var next = $('.next');
var recipes = $('.recipe-item');

// set first recipe as active
$('.recipes li:first').addClass('active');

// Open a specific recipe when selected from the recipe index
const recipeParam = new URLSearchParams(window.location.search).get("recipe");

if (recipeParam !== null) {
    const recipeIndex = Number.parseInt(recipeParam, 10);

    if (
        Number.isInteger(recipeIndex) &&
        recipeIndex >= 0 &&
        recipeIndex < recipes.length
    ) {
        const selectedRecipe = recipes.eq(recipeIndex);

        show(selectedRecipe);
        index = recipeIndex;
    }
}

// show one recipe (specified node) at a time
function show( node ){
  node.addClass('active') 
      // hide previously active node
      .siblings().removeClass('active');
}

// Show previous recipe
prev.on('click', function(e) {
  e.preventDefault();

  var activeRecipe = recipes.filter('.active');
  var previousNode = activeRecipe.prev('.recipe-item');

  if (!previousNode.length) {
      previousNode = recipes.last();
  }
  
  show(previousNode);
  index = recipes.index(previousNode);
});

// Show next recipe
next.on('click', function(e) {
  e.preventDefault();

  var activeRecipe = recipes.filter('.active');
  var nextNode = activeRecipe.next('.recipe-item');

  if (!nextNode.length) {
    nextNode = recipes.first();
  }

  show(nextNode);
  index = recipes.index(nextNode);
});

function parseIngredientAmount(value) {
  value = value.trim();

  if (/^(a|an)$/i.test(value)) {
    return 1;
  }

  // Support common Unicode fractions
  var unicodeFractions = {
    '½': 0.5,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '¼': 0.25,
    '¾': 0.75,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875
  };

  if (unicodeFractions[value] !== undefined) {
    return unicodeFractions[value];
  }

  // Support fractions such as 1/2 and 3/4
  var fractionMatch = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    var numerator = Number(fractionMatch[1]);
    var denominator = Number(fractionMatch[2]);
    return denominator === 0 ? NaN : numerator / denominator;
  }

  // Support mixed numbers such as 1 1/2
  var mixedMatch = value.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    var whole = Number(mixedMatch[1]);
    var top = Number(mixedMatch[2]);
    var bottom = Number(mixedMatch[3]);
    return bottom === 0 ? NaN : whole + top / bottom;
  }

  // Support ordinary integers and decimals
  return Number(value);
}

function updateScaledIngredientAmount(amountElement, outputElement, scale) {
  var originalAmount = amountElement.text().trim();
  var amount = parseIngredientAmount(originalAmount);
  var unitTextNode = outputElement[0].nextSibling;
  var originalUnitText = outputElement.data("originalUnitText");
  if (originalUnitText === undefined && unitTextNode && unitTextNode.nodeType === Node.TEXT_NODE) {
    originalUnitText = unitTextNode.textContent;
    outputElement.data("originalUnitText", originalUnitText);
  }

  if (unitTextNode && originalUnitText !== undefined) {
    unitTextNode.textContent = originalUnitText;
  }

  if (!Number.isFinite(amount)) {
    outputElement.text(originalAmount);
    return;
  }

  var unitPattern = "(soup spoons?|bunch(?:es)?|handfuls?|spoonfuls?|spoons?|shots?|cloves?|coffee spoons?)";
  var approximateUnitMatch = unitTextNode && unitTextNode.nodeType === Node.TEXT_NODE
    ? unitTextNode.textContent.match(
      new RegExp("^(\\s*)" + unitPattern + "(\\s+or\\s+two)(?=\\s|[,.(]|$)", "i")
    )
    : null;
  var unitMatch = unitTextNode && unitTextNode.nodeType === Node.TEXT_NODE
    ? unitTextNode.textContent.match(
      new RegExp("^(\\s*)" + unitPattern + "(?=\\s+(?!or\\b|and\\b)[\\w(]|[,.(]|$)", "i")
    )
    : null;
  var matchedUnit = approximateUnitMatch || unitMatch;
  var supportedIndefiniteAmount = /^(a|an)$/i.test(originalAmount) && matchedUnit;

  if (/^(a|an)$/i.test(originalAmount) && !supportedIndefiniteAmount) {
    outputElement.text(originalAmount);
    return;
  }

  var scaledAmount = amount * scale;
  if (approximateUnitMatch) {
    if (Math.abs(scale - 1) < 0.015) {
      outputElement.text(originalAmount);
      return;
    }

    var upperAmount = amount * 2 * scale;
    outputElement.text(
      formatIngredientAmount(scaledAmount) + "–" +
      formatIngredientAmount(upperAmount)
    );
    updateIngredientUnit(
      unitTextNode,
      approximateUnitMatch,
      upperAmount > 1.015
    );
    return;
  }

  var displayAmount = supportedIndefiniteAmount && Math.abs(scaledAmount - 1) < 0.015
    ? originalAmount
    : formatIngredientAmount(scaledAmount);
  outputElement.text(displayAmount);

  if (!unitMatch) return;

  updateIngredientUnit(unitTextNode, unitMatch, scaledAmount > 1.015);
}

function updateIngredientUnit(unitTextNode, unitMatch, shouldBePlural) {
  var unit = unitMatch[2];
  var unitForms = {
    "bunch": ["bunch", "bunches"],
    "clove": ["clove", "cloves"],
    "coffee spoon": ["coffee spoon", "coffee spoons"],
    "handful": ["handful", "handfuls"],
    "shot": ["shot", "shots"],
    "soup spoon": ["soup spoon", "soup spoons"],
    "spoon": ["spoon", "spoons"],
    "spoonful": ["spoonful", "spoonfuls"]
  };
  var unitType = Object.keys(unitForms).find(function(candidate) {
    return unitForms[candidate].includes(unit.toLowerCase());
  });
  var singularUnit = unitType && unitForms[unitType][0];
  var pluralUnit = unitType && unitForms[unitType][1];
  if (!unitType) return;

  var desiredUnit = shouldBePlural ? pluralUnit : singularUnit;
  var nextText = unitTextNode.textContent.replace(
    unitMatch[0],
    unitMatch[1] + desiredUnit
  );
  unitTextNode.textContent = nextText;
}


// Format ingredient amount for display, using Unicode fractions where appropriate
function formatIngredientAmount(value) {
  if (!Number.isFinite(value)) return value;

  var fractions = [
    { value: 0, text: '' },
    { value: 1 / 8, text: '⅛' },
    { value: 1 / 4, text: '¼' },
    { value: 1 / 3, text: '⅓' },
    { value: 3 / 8, text: '⅜' },
    { value: 1 / 2, text: '½' },
    { value: 5 / 8, text: '⅝' },
    { value: 2 / 3, text: '⅔' },
    { value: 3 / 4, text: '¾' },
    { value: 7 / 8, text: '⅞' },
    { value: 1, text: '' }
  ];

  var whole = Math.floor(value);
  var decimal = value - whole;
  var closest = fractions.reduce(function(best, fraction) {
    return Math.abs(fraction.value - decimal) <
      Math.abs(best.value - decimal) ? fraction : best;
  });

  if (Math.abs(closest.value - decimal) < 0.015) {
    return (whole || closest.text === '' ? whole : '') +
      (whole && closest.text ? ' ' : '') + closest.text || '0';
  }

  return Number(value.toFixed(3)).toString();
}

// update yield based on click (step up)
function increaseYield() {
  // find currently displayed recipe yield and increment values
  var activeRecipe = recipes.filter('.active');
  if (!activeRecipe.length) return; // No active recipe found, exit the function

  // find yield and increment values inside the active recipe
  var currentYieldElement = activeRecipe.find('.yield-output');
  var originalYieldElement = activeRecipe.find('.og-yield');
  var incrementElement = activeRecipe.find('.increment-output');

  // get current yield and increment values
  var currentYield = Number(currentYieldElement.text());
  var originalYield = Number(originalYieldElement.text());
  var currentIncrement = parseFloat(incrementElement.text());

  // Ensure current yield is a valid number
  currentYield = isNaN(currentYield) ? 1 : currentYield;

  // Increase the yield by the increment value
  currentYield += currentIncrement;

  // Update the yield display
  currentYieldElement.text(currentYield);

  // Update only ingredients in the active recipe
  activeRecipe.find('.ingredient').each(function() {
  var ingredient = $(this);

  ingredient.find('.ingredient-amount').each(function() {
    var amountElement = $(this);
    var outputElement = amountElement.next('.output-amount');

    if (!outputElement.length) return;

    if (originalYield > 0) {
      updateScaledIngredientAmount(
        amountElement,
        outputElement,
        currentYield / originalYield
      );
    }
  });
});
}

// update yield based on click (step down)
function decreaseYield() {
  // find currently displayed recipe yield and increment values
  var activeRecipe = recipes.filter('.active');
  if (!activeRecipe.length) return; // No active recipe found, exit the function

  // find yield and increment values inside the active recipe
  var currentYieldElement = activeRecipe.find('.yield-output');
  var originalYieldElement = activeRecipe.find('.og-yield');
  var incrementElement = activeRecipe.find('.increment-output');

  // get current yield and increment values
  var currentYield = Number(currentYieldElement.text());
  var originalYield = Number(originalYieldElement.text());
  var currentIncrement = parseFloat(incrementElement.text());

  // Ensure current yield is a valid number
  if (!Number.isFinite(currentYield) ||
      !Number.isFinite(originalYield) ||
      !Number.isFinite(currentIncrement) ||
      originalYield <= 0) return;
 
  // Decrease the yield by the increment value, ensuring it doesn't go below zero
  currentYield = Math.max(1, currentYield - currentIncrement);

  // Update the yield display
  currentYieldElement.text(currentYield);

  // Update only ingredients in the active recipe
  activeRecipe.find('.ingredient').each(function() {
  var ingredient = $(this);

  ingredient.find('.ingredient-amount').each(function() {
    var amountElement = $(this);
    var outputElement = amountElement.next('.output-amount');

    if (!outputElement.length) return;

    if (originalYield > 0) {
      updateScaledIngredientAmount(
        amountElement,
        outputElement,
        currentYield / originalYield
      );
    }
  });
});
}

// Reset active recipe to its original yield and ingredient amounts
function resetYield() {
  var activeRecipe = recipes.filter('.active');
  if (!activeRecipe.length) return;

  var originalYieldElement = activeRecipe.find('.og-yield');
  var currentYieldElement = activeRecipe.find('.yield-output');
  var originalYield = Number(originalYieldElement.text());

  if (!Number.isFinite(originalYield) || originalYield <= 0) return;

  currentYieldElement.text(originalYield);

  activeRecipe.find('.ingredient').each(function() {
    var ingredient = $(this);

    ingredient.find('.ingredient-amount').each(function() {
      var amountElement = $(this);
      var outputElement = amountElement.next('.output-amount');

      if (outputElement.length) {
        updateScaledIngredientAmount(amountElement, outputElement, 1);
      }
    });
  });
}

// Increase the increment value for the active recipe
function increaseIncrement() {
  // Find the currently displayed recipe
  var activeRecipe = recipes.filter('.active');
  if (!activeRecipe.length) return;

  // Get this recipe's increment display
  var incrementElement = activeRecipe.find('.increment-output');
  var currentIncrement = Number(incrementElement.text());

  if (!Number.isFinite(currentIncrement)) return;

  // Increase by 0.25
  currentIncrement += 0.25;
  incrementElement.text(Number(currentIncrement.toFixed(2)));
}

// Decrease the increment value for the active recipe
function decreaseIncrement() {
  // Find the currently displayed recipe
  var activeRecipe = recipes.filter('.active');
  if (!activeRecipe.length) return;

  // Get this recipe's increment display
  var incrementElement = activeRecipe.find('.increment-output');
  var currentIncrement = Number(incrementElement.text());

  if (!Number.isFinite(currentIncrement)) return;

  // Decrease by 0.25, with a minimum of 0.25
  currentIncrement = Math.max(0.25, currentIncrement - 0.25);
  incrementElement.text(Number(currentIncrement.toFixed(2)));
}
