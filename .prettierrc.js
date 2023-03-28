module.exports = {
    semi: false,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 4,
    overrides: [
        {
            files: ['src/**/*.ts', 'src/**/*.js'],
            options: {
                parser: 'typescript',
            },
        },
    ],
}
