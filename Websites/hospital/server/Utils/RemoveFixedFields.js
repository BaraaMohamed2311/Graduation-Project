function RemoveFixedFields(userData,fixedfields){
    
    for( const field of fixedfields){
        delete userData[field]
    }
    return userData

}

module.exports = RemoveFixedFields;