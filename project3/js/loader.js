WebFont.load({
    google: {
        families: ['Press Start 2P']
    },
    active: e => {
        // pre-load the images
        app.loader.
            add([
                "images/car.png",
                "images/track.png",
                "images/checkpoint-bottom.png",
                "images/checkpoint-right.png",
                "images/checkpoint-top.png",
                "images/checkpoint-left.png",
            ]);
        app.loader.onComplete.add(setup);
        app.loader.load();
    }
});