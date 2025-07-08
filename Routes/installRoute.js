// updated
const express = require("express");
const router=express.Router()

const {install}=require('../Controller/installController')
router.get("/install",install)

  module.exports=router