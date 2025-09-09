import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import store from './store';
import { Provider } from 'react-redux';

function RootWrapper() {
  useEffect(() => {
    const targetText = "Claim your FREE account and get a key in less than a minute";

    const observer = new MutationObserver(() => {
      const fixedDivs = document.querySelectorAll('div[style*="position: fixed"]');

      fixedDivs.forEach(div => {
        if (div.innerText.includes(targetText)) {
          div.classList.add('hide-fixed-overlay');
          observer.disconnect();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RootWrapper />
  </Provider>
);
