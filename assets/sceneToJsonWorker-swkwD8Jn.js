(function(){"use strict";self.onmessage=e=>{const{sceneData:t}=e.data;try{const s=JSON.stringify(t);self.postMessage({json:s})}catch(s){self.postMessage({error:s.message},[])}}})();
