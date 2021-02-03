var express = require('express'); 
var path = require('path'); 
var app = express(); 
var paypal = require('paypal-rest-sdk');


paypal.configure({
  'mode': 'sandbox', //sandbox or live 
  'client_id': 'ARrvwy5LT-Hhc7uNECudMhZBbxOFkp8e0YrKizCvALgC4iTzC2DM9_rhk4oYhfsgf6UxDFEbIHYKgzur',
  'client_secret': 'EP8-kCUqVPRZBv11EZmmzLGPbkqOczm8yXWRuCdp5028h23XMUiBxI6C-Luoib6k00OsoV7pqBEbZJsi'
});

// set public directory to serve static files 
app.use('/', express.static(path.join(__dirname, 'public'))); 


// redirect to store 
app.get('/' , (req , res) => {
    res.redirect('/index.html'); 
})

// start payment process 
app.get('/buy' , ( req , res ) => {
	var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
		"return_url": "http://127.0.0.1:3000/success",
		"cancel_url": "http://127.0.0.1:3000/err"
	},
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "item",
                "sku": "item",
                "price": "39.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "39.00"
        },
        "description": "This is the payment description."
    }]
	};
	
    createPay( create_payment_json ) 
        .then( ( transaction ) => {
			console.log( transaction ); 
            var id = transaction.id; 
            var links = transaction.links;
            var counter = links.length; 
            while( counter -- ) {
                if ( links[counter].method == 'REDIRECT') {
					console.log( links[counter].href );
                    return res.redirect( links[counter].href )
                }
            }
        })
        .catch( ( err ) => { 
            console.log( err ); 
            res.redirect('/err');
        });
}); 


app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "39.00"
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        // res.send('Success');
		res.redirect('/success.html'); 
    }
});
});

// app.get('/success' , (req ,res ) => {
//    console.log(req.query); 
//    res.redirect('/success.html'); 
// })

app.get('/err' , (req , res) => {
    console.log(req.query); 
    res.redirect('/err.html'); 
})

app.listen( 3000 , () => {
    console.log(' app listening on 3000 '); 
})



// helper functions 
var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
			console.log(payment);
            resolve(payment); 
        }
        }); 
    });
}