const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const Lists = require('../models/lists');


//create new parent list
router.post('/addParentList', passport.authenticate('jwt', {session:false} ) , (req, res, next) => {
    let newParentList = new Lists({
      name: req.body.name.toLowerCase(),
      description: req.body.description,
      parent_list_id: null,
      children_list_counter: 0,
      created_by: req.user._id,
      done: req.body.done
    });
    Lists.addList(newParentList, (err, list) => {
      if(err){
        res.json({success: false, msg:'Failed to add parent list'});
      } else {
        res.json({success: true, msg:'Parent list added', payload: list});
      }
    });
  });


//create new child list
router.post('/addChildList', passport.authenticate('jwt', {session:false} ) , (req, res, next) => {
  let newChildList = new Lists({
    name: req.body.name.toLowerCase(),
    description: req.body.description,
    parent_list_id: req.body.parent_list_id,
    children_list_counter: 0,
    created_by: req.user._id,
    done: req.body.done
  });
 
  Global_Parent_List = null;

  Lists.addList(newChildList, (err, list) => {
    if(err){
      res.json({success: false, msg:'Failed to add child list'});
    } 
    
    else {
      Lists.getListById(newChildList.parent_list_id, (err, Parent_List) => {
        if (err) throw err;
        else{
 
        Global_Parent_List = Parent_List;
        Lists.incrementChildListCounter(Global_Parent_List, (err, Parent_List_final) => {
          if (err) throw err;
          else {
            res.json({success: true, msg:'Child list added', payload: list});
          }
        });
      }
      });  
    }
  });
});


//remove list
router.delete('/removeList/:id', passport.authenticate('jwt', {session:false} ) , (req, res, next) => {
  Lists.getListById(req.params.id, (err, list) => {
    if (err) throw err;
    else{
      
      if (list.parent_list_id == null){

        //if parent list

        //find all lists that have the parent ID and delete them
        Lists.find({ parent_list_id: req.params.id }).remove().exec();
        //delete the actual parent list
        Lists.find({ _id: req.params.id }).remove().exec();

        res.json( {success: true, msg:'Removed Parent list successfully'} );
      }
      else {
        //if child list
        console.log("reached here");
  
        Lists.findOne({ _id : list.parent_list_id}, function(err, parent_list){
          if (err) throw err;
          else {
            console.log("test child");
            parent_list.children_list_counter = --parent_list.children_list_counter;
            parent_list.save();
            Lists.find({ _id: req.params.id }).remove().exec();
            res.json( {success: true, msg:'Removed list successfully'} );
          }
        });
      }
    }
  })
});      
 

router.put('/switchDone',passport.authenticate('jwt', {session:false} ) , (req, res, next) => { 
  Lists.findOne({_id : req.body._id}, function(err, list){
    if (err) throw err;
    else {
      if(list.done == 1){
        list.done = 0;
        list.save();
        res.json({success: true, msg:'Switched list to pending successfully'});
      }
      else{
        list.done = 1;
        list.save();
        res.json({success: true, msg:'Switched list to completed successfully'});
      }
            
    }
  });
});



  router.get('/getallParentLists', passport.authenticate('jwt', {session:false} ) , (req, res, next) => {   
    Lists.find({parent_list_id:null}, function(err, lists){
        if (err) return handleError(err); //maybe display an error message to the user?
        res.json({success: true, msg:'retrieved parent lists', payload: lists});
    })
  });


  router.get('/getallChildLists/:id', passport.authenticate('jwt', {session:false} ) , (req, res, next) => {   
    Lists.find({parent_list_id: req.params.id}, function(err, lists){
        if (err) return handleError(err); //maybe display an error message to the user?
        res.json({success: true, msg:'retrieved parent lists', payload: lists});
    })
  });

  router.put('/editListName', passport.authenticate('jwt', {session:false} ) , (req, res, next) => {
    const List_id = req.body._id;
    const name = req.body.name;

    //get the list name
    Lists.getListById(List_id, (err, list) => {
        if(err) throw err;

        else{ 
            Lists.editListName(list, name, (err, updatedList) => {
            if (err) {
                throw err;
            }
            else {
                res.json({success: true, msg:'List name has been updated', payload: updatedList});
            }
        });
            } 
    })
  });






//If this line is not added, an error for the router is shown in the terminal
module.exports = router;