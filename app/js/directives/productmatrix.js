four51.app.directive('productmatrix', function() {
    var obj = {
        restrict: 'E',
        scope: {
            address : '=',
            return: '=',
            user: '='
        },
        templateUrl: 'partials/controls/productMatrix.html',
        controller: 'ProductMatrixCtrl'
    }
    return obj;
});