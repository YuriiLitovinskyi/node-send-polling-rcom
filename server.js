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

            getOnlinePpks(db, async (ppkArray) => {
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
                                }, index * 1000);
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

// // Collection 'ppkState'
// const countAllOnlinePpk = (db, callback) => {
//     setTimeout(() => {
//         db.collection('ppkState', async (err, collection) => {
//             if(err) {
//                 console.log(err);
//                 db.close();
//                 await sleep(10000);
//             };
      
//             // Get all ppk online at the moment from collection ppkState
//             const onlinePpk = await collection.find({ markedAsOffline: false }).count();
//             console.log(`Total online ppks at the moment: ${onlinePpk}`); 

//             const onlinePpkObj = await collection.find({ markedAsOffline: false }).toArray((err, ppkArray) => {
                
//                 callback(ppkArray);

//             });                    
//         });        
//     }, 1000);    
// };


// Collection 'coll_ping'
const getOnlinePpks = (db, callback) => {
    setTimeout(() => {
        db.collection('coll_ping', async (err, collection) => {
            if(err) {
                console.log(err);
                db.close();
                await sleep(10000);
            };
      
            // Get all ppk online at the moment   4 * 60 = 4 minutes
            const onlinePpk = await collection.find({ time: {$lt: Date.now() - 172800 }}).count();
            console.log(`Total online ppks at the moment: ${onlinePpk}\n`); 

            // Get array of online ppks
            await collection.find({ time: {$lt: Date.now() - 172800 }}).toArray((err, ppkArray) => {
                if(err) {
                    console.log(err);
                    db.close();                    
                };                
                callback(ppkArray);
            });                          
        });        
    }, 1000);    
};

// Insert query polling in Collection 'coll_ping'
const sendPollingToPpk = (db, ppk_num, callback) => {
    db.collection('coll_ping', async (err, collection) => {
        if(err) {
            console.log(err);
            db.close();
            await sleep(10000);
        };

        await collection.updateOne({ ppk_num : ppk_num },
            { $set: { query : 48 } }, (err, result) => {
                if(err){
                    console.log(err);
                };         
            console.log(`${result}\n`);          
            });  
        callback();
    });
};