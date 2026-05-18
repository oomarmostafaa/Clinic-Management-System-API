export class APIFeature {
  constructor(mongooseQuery, searchQuery) {
    this.mongooseQuery = mongooseQuery;
    this.searchQuery = searchQuery;
  }

  // 📄 PAGINATION
  pagination() {
    let page = this.searchQuery.page * 1 || 1;
    if (page <= 0) page = 1;

    let limit = this.searchQuery.limit * 1 || 10;
    let skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    return this;
}

  // 🔍 FILTERS
  filters() {
    let filterObj = { ...this.searchQuery };

    let excludedFields = ['page', 'sort', 'limit', 'fields', 'keywords'];
    excludedFields.forEach(f => delete filterObj[f]);

    let filterStr = JSON.stringify(filterObj);
    filterStr = filterStr.replace(/(gte|gt|lte|lt)/g, match => `$${match}`);

    filterObj = JSON.parse(filterStr);

    this.mongooseQuery = this.mongooseQuery.find(filterObj);

    return this;
  }

  // 🔃 SORT
  sort() {
    if (this.searchQuery.sort) {
      let sortedBy = this.searchQuery.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortedBy);
    }
    return this;
  }

  // 🎯 SELECT FIELDS
  select() {
    if (this.searchQuery.fields) {
      let fields = this.searchQuery.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    }
    return this;
  }

  // 🔎 SEARCH
  search() {
    if (this.searchQuery.keywords) {
      this.mongooseQuery = this.mongooseQuery.find({
        $or: [
          { title: { $regex: this.searchQuery.keywords, $options: 'i' } },
          { description: { $regex: this.searchQuery.keywords, $options: 'i' } }
        ]
      });
    }

    return this;
  }
}