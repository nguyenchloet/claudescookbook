const cookingModeToggle = document.getElementById("cooking-mode-toggle");
const cookingModeStatus = document.querySelector(".cooking-mode-status");
let cookingModeEnabled = false;
let screenWakeLock = null;
let wakeLockRequestPending = false;

function setCookingModeStatus(message) {
    cookingModeStatus.textContent = message;
    cookingModeStatus.hidden = message.length === 0;
}

async function requestScreenWakeLock() {
    if (
        !cookingModeEnabled ||
        screenWakeLock ||
        wakeLockRequestPending ||
        document.visibilityState !== "visible"
    ) {
        return;
    }

    if (!("wakeLock" in navigator)) {
        cookingModeEnabled = false;
        cookingModeToggle.setAttribute("aria-checked", "false");
        setCookingModeStatus("Screen wake lock is not supported by this browser.");
        return;
    }

    wakeLockRequestPending = true;

    try {
        const wakeLock = await navigator.wakeLock.request("screen");
        screenWakeLock = wakeLock;
        cookingModeToggle.setAttribute("aria-checked", "true");
        setCookingModeStatus("");

        wakeLock.addEventListener("release", () => {
            if (screenWakeLock !== wakeLock) return;

            screenWakeLock = null;

            if (cookingModeEnabled && document.visibilityState === "visible") {
                cookingModeEnabled = false;
                cookingModeToggle.setAttribute("aria-checked", "false");
                setCookingModeStatus("The browser released the screen wake lock.");
            }
        });
    } catch (error) {
        console.error("Could not activate screen wake lock:", error);
        cookingModeEnabled = false;
        cookingModeToggle.setAttribute("aria-checked", "false");
        setCookingModeStatus(
            "Could not keep the screen awake. Check browser support and permissions."
        );
    } finally {
        wakeLockRequestPending = false;
    }
}

cookingModeToggle.addEventListener("click", async () => {
    if (wakeLockRequestPending) return;

    if (cookingModeEnabled) {
        cookingModeEnabled = false;
        cookingModeToggle.setAttribute("aria-checked", "false");
        setCookingModeStatus("");

        if (screenWakeLock) {
            const wakeLock = screenWakeLock;
            screenWakeLock = null;
            await wakeLock.release();
        }

        return;
    }

    cookingModeEnabled = true;
    await requestScreenWakeLock();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && cookingModeEnabled) {
        requestScreenWakeLock();
    }
});
