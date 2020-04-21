const MongoClient = require('mongodb').MongoClient;
const Confirm = require('prompt-confirm');
const prompt = new Confirm('Do you want to continue?');

const url = 'mongodb://localhost:27017/DBClientsPPK';

(() => {
    MongoClient.connect(url, async (err, db) => {
        if(err){
            console.log('No connection to Database! Please start MongoDB service on default port 27017!\n');                         
            console.log(err);
            await sleep(10000);
        } else {
            console.log('Connected to database successfully!\n');            

            countAllOnlinePpk(db, async (ppkArray) => {
                //console.log("ppkArray", ppkArray);

                if(ppkArray.length > 0){
                    ppkArray.sort((a, b) => a.ppk_num - b.ppk_num);

                    console.log(`Polling command will be sent to each device online with timeout of 60 seconds!`);
                    console.log(`Total time for program execution: ${ppkArray.length} minutes\n`)

                    prompt.ask((answer) => {                       
                        if(answer){
                            let counter = 0;
                            ppkArray.forEach((ppk, index) => {
                                setTimeout(async () => {
                                    await sendPollingToPpk(db, ppk.ppk_num, () => {
                                        console.log(`Polling sent to ppk number ${ppk.ppk_num}`);                               
                                    });   
                                    
                                    counter++;
                                    if(counter === ppkArray.length){
                                        setTimeout(async () => {
                                            console.log('All ppks received polling! Application will be closed!');
                                            db.close();
                                            await sleep(5000);
                                        }, 5000);                                
                                    };
                                }, index * 60000);
                            });
                        } else {
                            db.close();
                            return null;
                        }               
                    });                  
                } else {
                    console.log('No ppk online...')
                    db.close();
                    await sleep(10000);
                }
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

// Collection 'ppkState'
const countAllOnlinePpk = (db, callback) => {
    setTimeout(() => {
        db.collection('ppkState', async (err, collection) => {
            if(err) {
                console.log(err);
                db.close();
                await sleep(10000);
            };
      
            // Get all ppk online at the moment from collection ppkState
            const onlinePpk = await collection.find({ lastActivity: {$gt: (Date.now() - 4 * 60 * 1000) }}).count();           
            console.log(`Total online ppks at the moment: ${onlinePpk}`); 
         
            await collection.find({ lastActivity: {$gt: (Date.now() - 4 * 60 * 1000) }}).toArray((err, ppkArray) => {
                
                callback(ppkArray);

            });                    
        });        
    }, 1000);    
};


// Insert query polling in Collection 'ppkCommandQueue'
const sendPollingToPpk = (db, ppk_num, callback) => {
    db.collection('ppkCommandQueue', async (err, collection) => {
        if(err) {
            console.log(err);
            db.close();
            await sleep(10000);
        };
        
        await collection.insertOne({ 
            ppkNum : ppk_num,
            message: "POLL",
            time: Date.now() 
        }, async (err, result) => {
            if(err){
                console.log(err);
                db.close();
                await sleep(10000);
            };         
            console.log(`${result}\n`);
        });
        callback();
    });
};