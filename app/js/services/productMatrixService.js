four51.app.factory('ProductMatrix', ['$resource', '$451', 'Variant', function($resource, $451, Variant) {
    function _then(fn, data, count) {
        if (angular.isFunction(fn))
            fn(data, count);
    }

    function _extend(product) {

    }

    var _build = function(product, order, success) {
        var specCombos = {};
        angular.forEach(product.Specs, function(spec) {
            if (spec.ListOrder == 1) {
                angular.forEach(product.Specs, function(s) {
                    if (s.ListOrder == 2) {
                        angular.forEach(spec.Options, function(option) {
                            specCombos[option.Value] = [];
                            angular.forEach(s.Options, function(o) {
                                var combo = [option.ID, o.ID];
                                combo.Markup = option.Markup + o.Markup;
                                combo.Specs = {};
                                combo.Specs[spec.Name] = spec;
                                combo.Specs[s.Name] = s;
                                specCombos[option.Value].push(combo);
                            });
                        });
                    }
                });
            }
        });

        var comboVariants = {};
        var comboCount = 0;
        var variantCount = 0;
        for (var option in specCombos) {
            comboVariants[option] = [];
            angular.forEach(specCombos[option], function(combo) {
                comboCount++;
                getVariantData(product, combo, option);
            });
        }

        function countVariantInOrder(variant) {
            var count = 0;
            angular.forEach(order.LineItems, function(item) {
                if (item.Variant && item.Variant.ExternalID == variant.ExternalID) {
                    count = count + item.Quantity;
                }
            });
            return count;
        }

        function getVariantData(p, params, group) {
            Variant.get({'ProductInteropID': p.InteropID, 'SpecOptionIDs': params}, function(variant){
                variant.DisplayName = [];
                variant.Markup = params.Markup;
                variant.tempSpecs = {};
                angular.forEach(product.Specs, function(spec) {
                    angular.forEach(spec.Options, function(option) {
                        if (option.ID == params[0]) {
                            variant.tempSpecs[spec.Name] = {};
                            variant.tempSpecs[spec.Name].Value = option.Value;
                            variant.DisplayName[0] = option.Value;
                        }
                        if (option.ID == params[1]) {
                            variant.tempSpecs[spec.Name] = {};
                            variant.tempSpecs[spec.Name].Value = option.Value;
                            variant.DisplayName[1] = option.Value;
                        }
                    });
                });
                variant.OrderQuantity = order ? countVariantInOrder(variant) : 0;
                comboVariants[group].DisplayName = group;
                variantCount++;
                comboVariants[group].push(variant);
                if (variantCount == comboCount) {
                    _then(success, comboVariants);
                }
            });
        }
    }

    return {
        /*get: _get,
        search: _search*/
        build: _build
    }
}]);
