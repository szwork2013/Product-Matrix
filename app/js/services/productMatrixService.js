four51.app.factory('ProductMatrix', ['$resource', '$451', 'Variant', function($resource, $451, Variant) {
    function _then(fn, data, count, s1, s2) {
        if (angular.isFunction(fn))
            fn(data, count, s1, s2);
    }

    var _build = function(product, order, success) {
        var specCombos = {};
        var defineVariantSpecs = {};
        var defineVariantSpecCount = 0;
        var spec1Name = "";
        var spec2Name = "";
        angular.forEach(product.Specs, function(spec) {
            if (spec.DefinesVariant) {
                defineVariantSpecCount++;
                defineVariantSpecs[spec.Name] = spec;
            }
        });
        if (defineVariantSpecCount == 1) {
            angular.forEach(defineVariantSpecs, function(spec) {
                spec1Name = spec.Name;
                angular.forEach(spec.Options, function(option) {
                    specCombos[option.Value] = [];
                    var combo = [option.ID];
                    combo.Markup = option.Markup;
                    combo.Specs = {};
                    combo.Specs[spec.Name] = spec;
                    specCombos[option.Value].push(combo);
                });
            });
        }
        else if (defineVariantSpecCount == 2) {
            angular.forEach(defineVariantSpecs, function(spec) {
                if (spec.ListOrder == 1) {
                    spec1Name = spec.Name;
                    angular.forEach(product.Specs, function(s) {
                        if (s.ListOrder == 2) {
                            spec2Name = s.Name;
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
        }

        var comboVariants = {};
        var comboCount = 0;
        var variantCount = 0;
        for (var option in specCombos) {
            comboVariants[option] = [];
            angular.forEach(specCombos[option], function(combo) {
                combo.ListOrder = comboCount;
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
                variant.ListOrder = params.ListOrder;
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
                if (defineVariantSpecCount == 1) {
                    comboVariants[group].QuantityAvailable = variant.QuantityAvailable;
                    comboVariants[group].OrderQuantity = variant.OrderQuantity;
                    comboVariants[group].ListOrder = variant.ListOrder;
                }
                comboVariants[group].push(variant);
                if (variantCount == comboCount) {
                    if (defineVariantSpecCount == 1) {
                        //
                    }
                    else if (defineVariantSpecCount == 2) {
                        //
                    }
                    _then(success, comboVariants, defineVariantSpecCount, spec1Name, spec2Name);
                }
            });
        }
    }

    var _validateQty = function(matrix, product, success) {
        var qtyError = "";
        var priceSchedule = product.StandardPriceSchedule;
        angular.forEach(matrix, function(group) {
            angular.forEach(group, function(variant) {
                var qty = variant.Quantity;
                if (variant.Quantity) {
                    if(!$451.isPositiveInteger(qty))
                    {
                        qtyError += "<p>Please select a valid quantity for " + variant.DisplayName[0] + " " + (variant.DisplayName[1] ? variant.DisplayName[1] : "") + "</p>";
                    }
                }
                if(priceSchedule.MinQuantity > qty && qty != 0){
                    qtyError += "<p>Quantity must be equal or greater than " + priceSchedule.MinQuantity + " for " + variant.DisplayName[0] + " " + (variant.DisplayName[1] ? variant.DisplayName[1] : "") + "</p>";
                }
                if(priceSchedule.MaxQuantity && priceSchedule.MaxQuantity < qty){
                    qtyError += "<p>Quantity must be equal or less than " + priceSchedule.MaxQuantity + " for " + variant.DisplayName[0] + " " + (variant.DisplayName[1] ? variant.DisplayName[1] : "") + "</p>";
                }
                var qtyAvail = variant.QuantityAvailable;
                if(qtyAvail < qty && product.AllowExceedInventory == false){
                    qtyError = "<p>Quantity cannot exceed the Quantity Available of " +  qtyAvail + " for " + variant.DisplayName[0] + " " + (variant.DisplayName[1] ? variant.DisplayName[1] : "") + "</p>";;
                }
            });
        });

        _then(success, qtyError);
    }

    var _addToOrder = function(matrix, product, success) {
        var lineItems = [];
        angular.forEach(matrix, function(group) {
            angular.forEach(group, function(item) {
                if (item.Quantity > 0) {
                    var liSpecs = {};
                    for (var spec in product.Specs) {
                        liSpecs[spec] = angular.copy(product.Specs[spec]);
                        liSpecs[spec].Value = item.tempSpecs[spec].Value;
                    }
                    var li = {
                        "PriceSchedule":product.StandardPriceSchedule,
                        "Product":product,
                        "Quantity":item.Quantity,
                        "Specs":liSpecs,
                        "Variant":item,
                        "qtyError":null
                    }
                    lineItems.push(li);
                }
            });
        });
        _then(success, lineItems);
    }

    return {
        build: _build,
        validateQuantity: _validateQty,
        addToOrder: _addToOrder
    }
}]);
