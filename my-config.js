module.exports = {
    verbose: true,
    build: {
        overwriteDest: true,
    },
    run: {
        firefox: 'nightly',
    },
    ignoreFiles: [
        'build_scripts',
        '_*'
    ],
};