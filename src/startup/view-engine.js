import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebarsHelpers from '../utils/handlebars.helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (app) {
    app.engine('handlebars', engine({
        defaultLayout: 'main',
        helpers: handlebarsHelpers,
        partialsDir: [
            path.join(__dirname, '../views/partials'),
            path.join(__dirname, '../views/vwAccount')
        ]
    }));
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, '../views'));
}
