(function() {
    const storageKey = "claudesCookbookFontSize";
    const defaultSize = 15;
    const minimumSize = 13;
    const maximumSize = 19;
    const savedSize = Number(localStorage.getItem(storageKey));
    const initialSize = Number.isFinite(savedSize) &&
        savedSize >= minimumSize &&
        savedSize <= maximumSize
        ? savedSize
        : defaultSize;

    document.documentElement.style.fontSize = `${initialSize}px`;

    document.addEventListener("DOMContentLoaded", () => {
        const decreaseButton = document.getElementById("decrease-font-size");
        const increaseButton = document.getElementById("increase-font-size");

        function setFontSize(size) {
            document.documentElement.style.fontSize = `${size}px`;
            localStorage.setItem(storageKey, String(size));
        }

        decreaseButton.addEventListener("click", () => {
            const currentSize = parseFloat(
                getComputedStyle(document.documentElement).fontSize
            );
            setFontSize(Math.max(minimumSize, currentSize - 1));
        });

        increaseButton.addEventListener("click", () => {
            const currentSize = parseFloat(
                getComputedStyle(document.documentElement).fontSize
            );
            setFontSize(Math.min(maximumSize, currentSize + 1));
        });
    });
})();
