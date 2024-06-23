document.addEventListener("DOMContentLoaded", function () {
    const countElement = document.getElementById("count");
    let start = 0;
    const end = 3756; // The number to count up to
    const duration = 3000; // Duration of the counting animation in milliseconds

    const increment = end / (duration / 16.67); // 16.67ms per frame (60fps)
    const step = () => {
        start += increment;
        if (start >= end) {
            start = end;
            clearInterval(interval);
        }
        countElement.textContent = Math.floor(start).toLocaleString();
    };

    const interval = setInterval(step, 16.67); // Update every 16.67ms (~60fps)
});
