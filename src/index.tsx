import 'normalize.css/normalize.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './App.scss';
import {Perlin} from "./Perlin";
import registerServiceWorker from './registerServiceWorker';
import {Store} from "./stores/Store";


ReactDOM.render(
    <App perlin={new Perlin()} store={new Store()}/>,
    document.getElementById('root') as HTMLElement
);
registerServiceWorker();
