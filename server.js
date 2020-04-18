const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017/DBClientsPPK';

(async () => {
    const connectToMongo = await  MongoClient.connect(url, async (err, db) => {
        if(err){
            console.log('No connection to Database! Please start MongoDB service on default port 27017!\n');                       
            
            console.log(err);
            await sleep(10000);
        } else {
            console.log('Connected to database successfully!\n');

           countAllOnlinePpk(db, async (ppkArray) => {
                console.log("ppkArray", ppkArray);

                if(ppkArray.length > 0){

                } else {
                    console.log('No ppk online...')
                    db.close();
                    await sleep(10000);
                }

                db.close();
                await sleep(10000);
            });
            
        }
    });

    
})();

const sleep = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);        
    });
};

const countAllOnlinePpk = (db, callback) => {
    setTimeout(() => {
        db.collection('ppkState', async (err, collection) => {
            if(err) {
                console.log(err);
                db.close();
                await sleep(10000);
            };
      
            // Get all ppk online at the moment
            const onlinePpk = await collection.find({ markedAsOffline: false }).count();
            console.log(`Total online ppks at the moment: ${onlinePpk}`); 

            const onlinePpkObj = await collection.find({ markedAsOffline: false }).toArray((err, ppkArray) => {
                
                callback(ppkArray);

            });                    
        });        
    }, 1000);    
};