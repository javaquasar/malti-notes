(function () {
    function setActiveView(scope, view) {
        scope.querySelectorAll("[data-vocab-view-button]").forEach(function (button) {
            var isActive = button.dataset.vocabViewButton === view;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        scope.querySelectorAll("[data-vocab-view-panel]").forEach(function (panel) {
            panel.hidden = panel.dataset.vocabViewPanel !== view;
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-vocab-view-scope]"));
        if (scopes.length === 0) {
            return;
        }

        scopes.forEach(function (scope) {
            var buttons = Array.prototype.slice.call(scope.querySelectorAll("[data-vocab-view-button]"));
            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    setActiveView(scope, button.dataset.vocabViewButton);
                });
            });

            setActiveView(scope, "cards");
        });
    });
}());
