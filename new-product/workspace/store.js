/* Local prototype workspace only. No account, upload, or generation service. */
(() => {
  'use strict';
  const databaseName='new-product-complete-v02', storeName='workspace', key='current';
  let connection;
  function connect() {
    if(!window.indexedDB)return Promise.reject(new Error('Local storage unavailable'));
    if(connection)return connection;
    connection=new Promise((resolve,reject)=>{
      const request=window.indexedDB.open(databaseName,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName);};
      request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
      request.onerror=()=>{connection=null;reject(request.error||new Error('Storage unavailable'));};
      request.onblocked=()=>{connection=null;reject(new Error('Storage blocked'));};
    });
    return connection;
  }
  async function transaction(mode,apply) {
    const db=await connect();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,mode),request=apply(tx.objectStore(storeName));
      let value;request.onsuccess=()=>{value=request.result;};
      tx.oncomplete=()=>resolve(value);
      tx.onerror=()=>reject(tx.error||request.error||new Error('Storage failed'));
      tx.onabort=()=>reject(tx.error||new Error('Storage stopped'));
    });
  }
  window.AgentDraftStore={
    available:Boolean(window.indexedDB),
    read:()=>transaction('readonly',store=>store.get(key)),
    write:state=>transaction('readwrite',store=>store.put(state,key)),
    clear:()=>transaction('readwrite',store=>store.delete(key))
  };
})();
