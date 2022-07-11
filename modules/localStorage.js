export const db = {
    setItem: function(data){
        const key = data.id;
        const temp = JSON.stringify(data);
        localStorage.setItem(key, temp);
    },
    getItem: function(key){
        // 1 key wird ausgelesen
        const data = localStorage.getItem(key);
        return JSON.parse(data);
    },
    deleteItem: function(key){
        return localStorage.removeItem(key);
    },
    readAllItem: function(){
        const keys = Object.keys(localStorage);
        return keys.map((key) => db.getItem(key));
    }

}