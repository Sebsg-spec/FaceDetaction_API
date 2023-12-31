const express =require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'test',
      database : 'smart-brain'
    }
  });

const app = express();

app.use(cors());
app.use(express.json()); 

app.post('/signin', (req,res)=> {
    db.select('email', 'has').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].has);
        if(isValid){
           return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('Unable to get user'))
        }else{
            res.status(400).json('wrong credetials')
        }
    })
        .catch(err => res.status(400).json('Wrong credetials'))
 })

 app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
      db.transaction(trx => {
         trx.insert ({
             has: hash,
             email
         })
         .into('login')
         .returning('email')
         .then (loginEmail => {
            return trx('users')
             .returning('*')
             .insert({
               email: loginEmail[0].email,
                 name,
                 joined: new Date(),
           }).then(user => {
               res.json(user[0]);
                       })
       })
       .then(trx.commit)
       .catch(trx.rollback)
   })
   .catch(err => res.status(400).json('Unable to register'))
})

app.get('/profile/:id', (req,res)=>{
    const { id } = req.params;
    db.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            res.json(user[0])
        }else{
            res.status(400).json('not found')
        }
    })
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
      console.log(entries);
    })
    .catch(err => res.status(400).json('unable to get entries'))
  })

  app.listen(3000, ()=> {
    console.log('app is running on port 3000');
  })

  app.get('/', (req,res) =>{
    res.send(database.users);
})
